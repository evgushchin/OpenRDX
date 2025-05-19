import {TemplateRef} from '@angular/core';
import {SelectItem} from 'primeng/api';

export interface DynTableColumn<T> {
  field: keyof T | Array<keyof T> | string;
  header: string;
  sortable?: boolean | keyof T;
  /** CSS value width */
  width?: string;
  resizable?: boolean; // It indicates if the column can be resized. Default: true.
  templateRef?: TemplateRef<any>;
  editTemplateRef?: TemplateRef<any>;
  /** Column filter. */
  filterConfig?: DynColumnFilterTemplateConfig;
  /**
   * It indicates if the column can be reordered.
   * Default: true.
   */
  reorderable?: boolean;
  /**
   * It indicates if the column can be added or removed from the tables.
   * Default: true.
   */
  toggleable?: boolean;
}


export interface DynColumnFilterTemplateConfig {
  matchMode?: 'in' | 'notIn' | 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith';
  showMenu?: boolean;
  showClearButton?: boolean;
  /** Type of the input (string, number etc.) or a template ref. */
  template?: string | TemplateRef<any>;
  matchModeOptions?: SelectItem<any>[];
}
