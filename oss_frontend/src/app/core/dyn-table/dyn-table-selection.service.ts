import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {SelectionChangeEvent} from './dyn-table';

@Injectable()
export class DynTableSelectionService {
  private allSelected = false;
  private totalRows = 0;

  private includedRows = new Set<string>;
  private excludedRows = new Set<string>;

  private selectionChanged$ = new Subject<SelectionChangeEvent>();

  init(totalRows: number): void {
    this.totalRows = totalRows;
  }

  get selectionChanged(): Observable<SelectionChangeEvent> {
    return this.selectionChanged$;
  }

  selectAll(): void {
    this.allSelected = true;
    this.includedRows.clear();
    this.excludedRows.clear();
    this.triggerEvent();
  }

  unSelectAll(): void {
    this.allSelected = false;
    this.includedRows.clear();
    this.excludedRows.clear();
    this.triggerEvent();
  }

  selectRow(rowId: string): void {
    if (!this.allSelected) {
      this.includedRows.add(rowId);

      if (this.includedRows.size === this.totalRows) {
        this.includedRows.clear();
        this.allSelected = true;
      }
    } else if (this.allSelected) {
      this.excludedRows.delete(rowId);
    }

    this.triggerEvent();
  }

  unselectRow(rowId: string): void {
    if (!this.allSelected) {
      this.includedRows.delete(rowId);
    } else {
      this.excludedRows.add(rowId);

      if (this.excludedRows.size === this.totalRows) {
        this.excludedRows.clear();
        this.allSelected = false;
      }
    }

    this.triggerEvent();
  }

  isRowSelected(rowId: string): boolean {
    if (this.allSelected) {
      return !this.excludedRows.has(rowId);
    } else {
      return this.includedRows.has(rowId);
    }
  }

  private triggerEvent(): void {
    this.selectionChanged$.next({
      allSelected: this.allSelected,
      affectedRows: this.allSelected ? this.excludedRows : this.includedRows,
    });
  }
}
