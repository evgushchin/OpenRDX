import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {finalize, Observable, Subscription} from 'rxjs';
import {get} from 'lodash-es';
import {MultiSelectModule} from 'primeng/multiselect';
import {SelectModule} from 'primeng/select';
import {ToastModule} from 'primeng/toast';
import {ToolbarModule} from 'primeng/toolbar';
import {MessageService, ScrollerOptions} from 'primeng/api';
import {RippleModule} from 'primeng/ripple';
import {ButtonModule} from 'primeng/button';
import {CheckboxChangeEvent, CheckboxModule} from 'primeng/checkbox';
import {DropdownLazyLoadEvent, DropdownModule} from 'primeng/dropdown';
import {Table, TableEditCompleteEvent, TableLazyLoadEvent, TableModule} from 'primeng/table';
import {BulkAction, DynTableSettings, FilterMeta, SelectionChangeEvent} from './dyn-table';
import {AppSettings} from '../../app.settings';
import {Ordering} from '../models/ordering';
import {DynTableSelectionService} from './dyn-table-selection.service';
import {DynColumnFilterTemplateConfig} from './dyn-table-column';
import {DynTableColumnService} from './dyn-table-column.service';
import {Identifiable} from '../models/identifiable';
import {StringTemplateOutletDirective} from '../utils/string-template-outlet.directive';
import {Paginated} from '../models/paginated';

@Component({
  selector: 'dyn-table',
  templateUrl: './dyn-table.component.html',
  preserveWhitespaces: false,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, TableModule, ToastModule,
    ButtonModule, ToolbarModule, DropdownModule, CheckboxModule,
    StringTemplateOutletDirective, MultiSelectModule, SelectModule,
    RippleModule,
  ],
  providers: [
    MessageService,
    DynTableSelectionService,
    DynTableColumnService,
  ],
  styles: [`
    .overflow-visible {
      overflow: visible !important;
    }

    .hasTemplateFilter .p-datatable > .p-datatable-table-container {
      overflow: visible !important;
    }

    .hasEditInPlace .p-datatable {
      & > .p-datatable-table-container,
      & .p-cell-editing {
        overflow: visible;
      }
    }
  `],
})
export class DynTableComponent<T extends Identifiable> implements OnChanges, OnDestroy {
  @Input() settings!: DynTableSettings<T>;

  /** Reference to the table component. */
  @ViewChild(Table) protected dt!: Table;

  /** Loading indicator */
  loading = false;

  /** Loaded values */
  protected records: T[] = [];
  protected totalRecords = 0;

  /** The state of the table header checkbox. */
  protected tableHeaderCheckboxState: boolean | null = null;

  /** Selected bulk action. Used with {@link DynTableSettings.bulkActions}. */
  protected selectedBulkAction: BulkAction['action'] | null = null;

  /**
   * Bulk actions.
   * We need to use lazy loading in order to update the "disabled" states of the dropdown options
   */
  protected bulkActions?: BulkAction[];

  /**
   * Indicates whether a row is in editing mode (in place).
   * It is used to set overflow: visible for the table when a row is in editing mode.
   */
  protected isEditingInPlace = false;

  /** Options for the bulk actions dropdown. */
  protected readonly bulkActionsDropdownOptions: ScrollerOptions = {
    loaderDisabled: true,
    lazy: true,
    itemSize: 30,
    scrollHeight: '200px',
    onLazyLoad: this.triggerBulkActionsUpdate.bind(this),
  };

  /** Indicates whether user has defined bulk actions. */
  protected get hasBulkActions(): boolean {
    return this.settings.bulkActions !== undefined && this.settings.bulkActions.length > 0;
  }

  /** Indicates whether to show checkboxes in front of each row. */
  protected get hasSelectionHandler(): boolean {
    return this.settings.selectionChange !== undefined;
  }

  /** Indicates whether user has defined an action to create a new item. */
  protected get hasCreateButton(): boolean {
    return this.settings.createItem !== undefined;
  }

  protected get hasUpdateButton(): boolean {
    return this.settings.updateItem !== undefined;
  }

  protected get hasDeleteButton(): boolean {
    return this.settings.deleteItem !== undefined;
  }

  protected get hasActionButtonsTemplate(): boolean {
    return this.settings.actionButtonsTemplateRef !== undefined;
  }

  protected get isExpandable(): boolean {
    return this.settings.expandableRowConfig !== undefined;
  }

  /**
   * Indicates if the table should have a toolbar. There are two conditions to display it.
   * - it has "create" button
   * OR
   * - it has bulk actions.
   */
  protected get hasToolbar(): boolean {
    return this.hasBulkActions ||
      this.hasCreateButton ||
      this.settings.toolbarLeftExtra !== undefined ||
      this.settings.toolbarRightExtra !== undefined;
  }

  /** A number of items per page. */
  protected readonly itemsPerPage = AppSettings.itemsPerPage;

  private subscriptions = new Subscription();

  private selectionServiceSubscription?: Subscription;

  constructor(
    public selectionService: DynTableSelectionService,
    public columnService: DynTableColumnService<T>,
    private messageService: MessageService,
    private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['settings']) {
      this.columnService.setColumns(this.settings.columns);
      this.columnService.setStorageKey(this.settings.toggleableColumnsCacheKey);
    }
  }

  /** Handles the change of the table page. */
  filter(value: any, field: string, matchMode: string): void {
    this.dt.filter(value, field, matchMode);
  }

  /** Reloads the data of the table. */
  reload(): void {
    this.loadData({
      first: this.dt.first ?? undefined,
      rows: this.dt.rows,
      multiSortMeta: this.dt.multiSortMeta,
      filters: this.dt.filters,
    });
  }

  /** Returns the number of all records in all pages */
  getTotalRecords(): number {
    return this.totalRecords;
  }

  protected hasFilters(): boolean {
    return this.settings.columns.filter((column) => column.filterConfig !== undefined).length > 0;
  }

  /**
   * Checks if the column has a filter, and it's defined as template.
   * @param config The column filter config.
   * @protected
   */
  protected hasColumnFilterTemplate(config: DynColumnFilterTemplateConfig | undefined): boolean {
    return config !== undefined && config.template !== undefined && !this.isString(config.template);
  }

  protected hasTemplateFilters(): boolean {
    return this.settings.columns.filter(
      (column) => this.hasColumnFilterTemplate(column.filterConfig),
    ).length > 0;
  }

  /**
   * Loads data into the table from data source.
   * if no event is specified, it will fetch the first page.
   * @param event
   */
  protected loadData(event: TableLazyLoadEvent = {first: 0, rows: this.itemsPerPage}): void {
    this.loading = true;
    const first = event.first ?? 0;
    const size = event.rows ?? this.itemsPerPage;
    const page = (first / size) + 1;
    const sorting = event.multiSortMeta ? event.multiSortMeta.map(meta => meta as Ordering) : [];
    const filter: FilterMeta = {};
    for (let prop in event.filters) {
      if (event.filters.hasOwnProperty(prop) && event.filters[prop] !== undefined) {
        filter[prop] = event.filters[prop];
      }
    }

    const subscription = this.settings.items$(page, sorting, filter)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetectorRef.detectChanges();
          if (event.forceUpdate) event.forceUpdate();
        }),
      )
      .subscribe({
        next: (page: Paginated<T>) => {
          this.records = page.results;
          this.totalRecords = page.count;
          // The service should be initialized only when `totalRecords` is set.
          this.initSelectionService();
        },
        error: ({error}) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message,
            closable: true,
          });
        },
      });
    this.subscriptions.add(subscription);
  }

  /** Call the corresponding bulk action. */
  protected bulkActionGo(): void {
    // Bulk actions should be defined and the selected action should be within the range of actions.
    if (!this.hasBulkActions || this.selectedBulkAction === null || this.selectedBulkAction === undefined) {
      return;
    }

    // Call the action.
    this.loading = true;
    // Check the type of the action.
    const action = this.selectedBulkAction();
    if (action instanceof Observable) {
      const subscription = action
        .pipe(
          finalize(() => {
            this.loading = false;
            this.selectedBulkAction = null; // Reset
            this.changeDetectorRef.detectChanges();
          }),
        )
        .subscribe({
          next: () => {
            this.loadData();
          },
          error: ({error}) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message,
              closable: true,
            });
          },
        });
      this.subscriptions.add(subscription);
    } else {
      this.selectedBulkAction = null; // Reset
      this.loading = false;
    }
  }

  /**
   * Handles the change of the table header checkbox.
   * @param value
   */
  protected onTableHeaderCheckboxStateChanged({checked}: CheckboxChangeEvent): void {
    if (checked !== true) { // null or false
      // Uncheck the header checkbox
      this.tableHeaderCheckboxState = null;

      // Make sure that the flag of "all rows selected" is false.
      this.selectionService.unSelectAll();
    } else {
      this.selectionService.selectAll();
    }
  }

  /**
   * Returns true if the row is selected.
   * @param row
   */
  protected isRowSelected(row: T): boolean {
    return this.selectionService.isRowSelected(row.id!);
  }

  /**
   * Row selection handler. It's triggered when user checks a checkbox of a row.
   * @param row The affected row.
   * @param checked Indicates if the row was checked or unchecked.
   */
  protected onRowSelectionChange(row: T, checked: boolean): void {
    if (checked) {
      this.selectionService.selectRow(row.id!);
    } else {
      this.selectionService.unselectRow(row.id!);
    }
  }

  /**
   * Initializes selection service.
   * The service should be initialized only when `totalRecords` is set.
   * @private
   */
  private initSelectionService(): void {
    if (this.hasSelectionHandler) {
      this.selectionService.init(this.totalRecords);
      this.watchForSelectionChanges();
    } else {
      this.selectionServiceSubscription?.unsubscribe();
    }
  }

  /**
   * Subscribe to selection changes.
   * It should be called only if the selection handler is defined.
   * @private
   */
  private watchForSelectionChanges(): void {
    if (this.selectionServiceSubscription && !this.selectionServiceSubscription.closed) {
      // Make sure that there is only one subscription;
      return;
    }
    this.selectionServiceSubscription = this.selectionService.selectionChanged.subscribe((event: SelectionChangeEvent) => {
      this.toggleHeaderCheckbox(event);
      // Emit the event to a parent of the table.
      this.settings.selectionChange!(event);
    });
    this.subscriptions.add(this.selectionServiceSubscription);
  }

  /**
   * Toggles header checkbox into the correct state.
   * @param state The current state of the selection.
   * @private
   */
  private toggleHeaderCheckbox(state: SelectionChangeEvent): void {
    if (!state.allSelected && state.affectedRows.size === 0) {
      // When no rows are selected, the header checkbox should be unchecked.
      this.tableHeaderCheckboxState = null;
    } else this.tableHeaderCheckboxState = state.allSelected && state.affectedRows.size === 0;
  }

  /**
   * Updates the disabled state of the bulk actions dropdown options.
   * @private
   */
  protected triggerBulkActionsUpdate(event: DropdownLazyLoadEvent): void {
    // When the dropdown is opened for the first time it is called twice.
    // OnLazyLoad is called twice with both .first and .rows equal to zero.
    // The first call allows to fetch totalCount from server and initialize virtualItems array, but the second is redundant.
    if (event.first === 0 && event.last === 0) {
      // Just init the bulk actions.
      this.bulkActions = this.settings.bulkActions;
      return;
    }

    this.bulkActions = this.settings.bulkActions?.map(obj => ({
      ...obj,
      // Update the disabled state of the action.
      disabled: obj?.disabled === undefined ? false : typeof obj.disabled === 'function' ? obj.disabled() : obj.disabled,
    }));
  }

  protected onEditInit(): void {
    this.isEditingInPlace = true;
    this.changeDetectorRef.detectChanges();
  }

  protected onEditCancel(): void {
    this.isEditingInPlace = false;
    this.changeDetectorRef.detectChanges();
  }

  protected onEditComplete(event: TableEditCompleteEvent): void {
    if (this.isEditingInPlace) { // For some reason when changing the page, the event is triggered.
      this.isEditingInPlace = false;
      this.changeDetectorRef.detectChanges();
      if (this.settings.rowUpdatedInPlace) {
        // Calculate the index of the row in the current page.
        // The event returns the index of the row in the whole dataset.
        const currentPage = (this.dt.first ?? 0) / this.itemsPerPage;
        const rowIndex = event.index! - this.itemsPerPage * currentPage;
        this.settings.rowUpdatedInPlace(this.records[rowIndex].id!, event.field!, event.data);
      }
    }
  }

  /**
   * Creates a template context for a column of  multiple fields.
   * @param fields a list of field.
   * @param item The model item.
   */
  protected getTemplateContext(fields: Array<keyof T>, item: T): Record<keyof T, any> {
    return fields.reduce((acc, key: keyof T) => {
      acc[key] = item[key];
      return acc;
    }, {} as Record<keyof T, any>);
  }

  /** View helper */
  protected isArray(value: string): boolean {
    return Array.isArray(value);
  }

  protected isString(value: string | TemplateRef<any> | undefined): boolean {
    return typeof value === 'string';
  }

  /** A view wrapper for lodash `get`. */
  protected getItemAtPath(item: Record<string, any>, path: string): any {
    return get(item, path);
  }
}
