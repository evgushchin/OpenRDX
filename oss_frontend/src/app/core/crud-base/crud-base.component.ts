import {Directive, ViewChild} from '@angular/core';
import {finalize, Observable} from 'rxjs';
import {DynTableComponent, DynTableSettings, FilterMeta, SelectionChangeEvent} from '../dyn-table';
import {CrudService} from '../services/crud.service';
import {Ordering} from '../models/ordering';
import {Crud} from './crud';
import {Identifiable} from '../models/identifiable';
import {DynDropdownOption} from '../components/dynamic-form/dyn-dropdown/dyn-dropdown';
import {Paginated} from '../models/paginated';

@Directive()
export class CrudBaseComponent<EntityType extends Identifiable> extends Crud<EntityType> {
  @ViewChild(DynTableComponent) protected dynTable!: DynTableComponent<EntityType>;

  /**
   * Represents the state of a selection.
   * @property {SelectionChangeEvent} [selectionState] - Optional event that represents the selection change.
   */
  protected selectionState?: SelectionChangeEvent;
  protected filter: FilterMeta = {};

  private dynTableSettings: DynTableSettings<EntityType> = {
    columns: [],
    items$: this.getPage.bind(this),
    createItem: this.createItem.bind(this),
    updateItem: this.updateItem.bind(this),
    deleteItem: this.deleteItem.bind(this),
    selectionChange: this.selectionChange.bind(this),
    bulkActions: [
      {
        label: 'Eliminar seleccionados',
        action: this.confirmDeleteSelectedItems.bind(this),
        disabled: () => {
          return !this.hasSelectedItems();
        }
      },
    ],
  };

  protected hasSelectedItems(): boolean {
    return this.selectionState !== undefined;
  }

  protected get tableSettings(): DynTableSettings<EntityType> {
    return this.dynTableSettings;
  }

  protected set tableSettings(settings: Partial<DynTableSettings<EntityType>>) {
    this.dynTableSettings = { ...this.dynTableSettings, ...settings };
  }

  /**
   * Constructor for CrudBaseComponent.
   * @param crudService - The CRUD service for the entity type.
   */
  constructor(crudService: CrudService<EntityType>) {
    super(crudService);
  }

  protected dropdownArrayToIdList(dropdownOptions: DynDropdownOption[]): string[] {
    return dropdownOptions.map((o) => o.id);
  }

  protected override onEntityDeletedSuccessfully(): void {
    this.dynTable.reload();
  }

  /**
   * Returns a number of currently selected items.
   * @protected
   */
  protected getNumberOfSelectedItems(): number {
    if (!this.selectionState) return 0;

    return Math.abs(+this.selectionState.allSelected * this.dynTable.getTotalRecords() - this.selectionState.affectedRows.size);
  }

  /**
   * Fetches a paginated list of entities.
   * @param page - The page number to fetch.
   * @param order - The ordering criteria.
   * @param filter - Filtering.
   * @returns An Observable of paginated entities.
   */
  protected getPage(page: number, order: Ordering[], filter: FilterMeta): Observable<Paginated<EntityType>> {
    this.filter = filter;
    return this.crudService.getPage(page, { order, filter });
  }

  protected selectionChange(event: SelectionChangeEvent): void {
    this.selectionState = (!event.allSelected && event.affectedRows.size === 0) ? undefined : event;
  }

  /**
   * Confirm deletion
   * @protected
   */
  protected confirmDeleteSelectedItems(): void {
    if (!this.selectionState) return;

    const numberOfSelectedItems = this.getNumberOfSelectedItems();
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar ${numberOfSelectedItems} ${numberOfSelectedItems === 1 ? 'el registro' : 'los registros'}?`,
      header: 'Confirmación de Eliminación',
      acceptIcon: "none",
      rejectIcon: "none",
      icon: "pi pi-exclamation-triangle",
      acceptButtonStyleClass: "p-button-danger",
      acceptLabel: "Borrar",
      rejectLabel: "Cancelar",
      rejectButtonStyleClass: "p-button-text p-button-plain",
      defaultFocus: "reject",
      accept: () => this.deleteSelectedItems(this.selectionState!),
    });
  }

  /** Deletes the selected items. */
  private deleteSelectedItems(state: SelectionChangeEvent): void {
    this.dynTable.loading = true;
    const numberOfSelectedItems = this.getNumberOfSelectedItems();
    const subscription = this.crudService.deleteSome(
      state.allSelected,
      Array.from(state.affectedRows),
      this.filter,
    ).pipe(
      finalize(() => {
        this.dynTable.loading = false;
      }),
    ).subscribe({
      next: () => {
        this.showSuccessMessage(`${numberOfSelectedItems} registros${numberOfSelectedItems === 1 ? ' ha' : 's han'} sido eliminado correctamente.`);
        this.dynTable.selectionService.unSelectAll();
        this.dynTable.reload();
      },
      error: ({ error }) => this.showErrorMessage(error.message)
    });
    this.subscriptions.add(subscription);
  }
}
