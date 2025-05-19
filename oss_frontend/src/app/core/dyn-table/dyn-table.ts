import {TemplateRef} from '@angular/core';
import {Observable} from 'rxjs';
import {FilterMetadata} from 'primeng/api';
import {DynTableColumn} from './dyn-table-column';
import {Ordering} from '../models/ordering';
import {Identifiable} from '../models/identifiable';
import {Paginated} from '../models/paginated';

export interface DynTableSettings<T extends Identifiable> {
  columns: DynTableColumn<T>[];
  /** When set, columns can be added or removed by user. */
  toggleableColumnsCacheKey?: string;
  items$: (page: number, ordering: Ordering[], filters: FilterMeta) => Observable<Paginated<T>>;
  paginator?: boolean; // whether to show paginator. default: true
  createItem?: () => void;
  updateItem?: (item: T) => void;
  deleteItem?: (item: T) => void;
  /** Action buttons template in each row (in case if you need to customize actions) */
  actionButtonsTemplateRef?: TemplateRef<any>
  bulkActions?: BulkAction[];
  selectionChange?: (event: SelectionChangeEvent) => void;
  /**
   * This is called when a row is updated in place.
   * @see DynTableColumn.editTemplateRef */
  rowUpdatedInPlace?: (id: string, field: string, value: any) => void;
  /** Extra content to be displayed in the toolbar on the left side just after the bulk actions (if present). */
  toolbarLeftExtra?: string | TemplateRef<void>;
  /** Extra content to be displayed in the toolbar on the right side just before the add button (if present). */
  toolbarRightExtra?: string | TemplateRef<void>;
  /** Indicates what content should be displayed in an expanded row. */
  expandableRowConfig?: ExpandableRowConfig;
}

export interface BulkAction {
  label: string;
  disabled?: (() => boolean) | boolean;
  action: () => Observable<void> | void;
}

export interface SelectionChangeEvent {
  allSelected: boolean;
  /**
   * When allSelected is true, this array contains items that are excluded from the selection.
   * When allSelected is false, this array contains only selected items.
   */
  affectedRows: Set<string>;
}

export interface FilterMeta {
  [field: string]: FilterMetadata | FilterMetadata[];
}

export interface ExpandableRowConfig {
  templateRef: TemplateRef<any>;
}
