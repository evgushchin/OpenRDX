import {computed, effect, Injectable, OnDestroy, Signal, signal, WritableSignal} from '@angular/core';
import {debounceTime, Subject, Subscription} from 'rxjs';
import {DynTableColumn} from './dyn-table-column';

const encodeField = (field: any) => btoa(
  Array.isArray(field) ? field.join('|') : field,
);

@Injectable()
export class DynTableColumnService<DataType> implements OnDestroy {
  /** A list of columns that should be shown in the table. */
  readonly selectedColumns: WritableSignal<DynTableColumn<DataType>[]> = signal([]);
  readonly visible: Signal<DynTableColumn<DataType>[]> = computed(() => {
      // A side effect of the signals.
      // We need to add dependency in order to make the code to be triggered when the signal changes.
      this.selectedColumns();
      return this.allColumns.filter((column: DynTableColumn<DataType>) => {
        return !this.isToggleable(column) || this.selectedColumnsIds.includes(encodeField(column.field));
      });
    }
  );
  /** Indicates if the service is initialized or not. */
  private isInitializing: boolean = true;
  /** Columns settings cache storage key. If it's undefined, settings won't be saved. */
  private storageKey?: string;
  /** A list of all columns. */
  private allColumns: DynTableColumn<DataType>[] = [];
  /** A list of toggleable columns. */
  private toggleable: DynTableColumn<DataType>[] = [];
  /** A list of selected column ids to keep track of the changes. */
  private selectedColumnsIds: string[] = [];
  /** Emits a value when the service settings were changed. */
  private columnSettingsLoader = new Subject<true>();
  /** The service subscriptions. */
  private subscriptions: Subscription = new Subscription();

  /**
   * Returns an array of toggleable columns in the dynamic table.
   *
   * @return {DynTableColumn[]} An array of columns that can be toggled.
   */
  get toggleableColumns(): DynTableColumn<DataType>[] {
    return this.toggleable;
  }

  constructor() {
    this.watchForColumnSettingsLoader();
    effect(() => {
      this.setSelectedColumnsIds();
      this.saveColumnSettings();
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /** Sets the table columns */
  setColumns(columns: DynTableColumn<DataType>[]) {
    this.allColumns = columns;
    this.toggleable = this.allColumns.filter((column: DynTableColumn<DataType>) => this.isToggleable(column));
    this.columnSettingsLoader.next(true);
  }

  /** Sets the storage key. */
  setStorageKey(storageKey: string | undefined): void {
    this.storageKey = storageKey;
    this.columnSettingsLoader.next(true);
  }

  /**
   * Determines whether a given column is resizable.
   *
   * @param {DynTableColumn} column - The column definition to check for resizability.
   * @return {boolean} - Returns true if the column is resizable, or if the resizable property is undefined;
   * otherwise returns false.
   */
  isResizable(column: DynTableColumn<DataType>): boolean {
    return column.resizable === undefined || column.resizable;
  }

  /**
   * Determines if the given column is reorderable.
   *
   * @param {DynTableColumn} column - The table column to check for reorderability.
   * @return {boolean} True if the column is reorderable, otherwise false.
   */
  isReorderable(column: DynTableColumn<DataType>): boolean {
    return false; // column.reorderable === undefined || column.reorderable;
  }

  /**
   * Determines if the given column is toggleable.
   * A column is considered toggleable if the `toggleable` property is either
   * `undefined` or evaluates to `true`.
   *
   * @param {DynTableColumn} column - The column to check for toggleability.
   * @return {boolean} `true` if the column is toggleable; otherwise, `false`.
   */
  isToggleable(column: DynTableColumn<DataType>): boolean {
    return column.toggleable === undefined || column.toggleable;
  }

  getSortableField(column: DynTableColumn<DataType>): string{
    if (!Array.isArray(column.field)) {
      return column.field as string;
    }

    if (column.sortable === true) {
      return column.field[0] as string;
    }

    return column.sortable as string;
  }

  /**
   * Watches for changes in the column settings loader by subscribing to it with a debounce time of 5 milliseconds.
   *
   * @return {void} This method does not return a value.
   */
  private watchForColumnSettingsLoader(): void {
    const subscription = this.columnSettingsLoader.pipe(
      debounceTime(5),
    ).subscribe(() => this.loadColumnsSettings());
    this.subscriptions.add(subscription);
  }

  /**
   * Loads the column settings from local storage based on a specified storage key.
   * If user preferences are found in local storage, it sets the visible columns to those preferences.
   * If no user preferences are found, it sets all columns as visible.
   * @return {void}
   */
  private loadColumnsSettings(): void {
    const columnSettings = this.storageKey ? localStorage.getItem(this.storageKey) : null;
    this.isInitializing = false;
    if (columnSettings) {
      const visibleColumnsIds = JSON.parse(columnSettings);
      const selectedColumns = this.toggleableColumns.filter((column: DynTableColumn<DataType>) => {
        return !this.isToggleable(column) || visibleColumnsIds.includes(encodeField(column.field));
      });

      this.selectedColumns.set(selectedColumns);
    } else {
      // There are no user preferences. Set all columns as visible.
      this.selectedColumns.set(this.toggleableColumns);
    }
  }

  private saveColumnSettings(): void {
    if (!this.storageKey || this.isInitializing) return;
    localStorage.setItem(this.storageKey!, JSON.stringify(this.selectedColumnsIds));
  }

  private setSelectedColumnsIds(): void {
    this.selectedColumnsIds = this.selectedColumns().map((column: DynTableColumn<DataType>) => encodeField(column.field));
  }
}
