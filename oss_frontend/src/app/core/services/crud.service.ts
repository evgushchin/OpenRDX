import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {FilterMetadata} from 'primeng/api';
import {Ordering} from '../models/ordering';
import {CrudParams} from '../models/crud-params';
import {FilterMeta} from '../dyn-table';
import {DynDropdownOption} from '../components/dynamic-form/dyn-dropdown/dyn-dropdown';
import {Identifiable} from '../models/identifiable';
import {Paginated} from '../models/paginated';

@Injectable()
export class CrudService<T extends Identifiable> {
  protected http: HttpClient = inject(HttpClient);
  protected apiUrl: string = '';

  static asDropdownOption(model: Identifiable & { title: string } | any): DynDropdownOption {
    return {
      id: model.id!,
      label: model.title,
    };
  }

  getPage(page: number, {filter, order}: CrudParams = {}): Observable<Paginated<T>> {
    const orderQuery = (order && order.length > 0) ? `&ordering=${CrudService.orderingToQuery(order)}` : '';
    const filterQuery = Object.keys(filter ?? {}).length > 0 ? `&${CrudService.filterToQuery(filter!)}` : '';
    return this.http.get<Paginated<T>>(`${this.apiUrl}/?page=${page}${orderQuery}${filterQuery}`);
  }

  getById(id: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${id}/`);
  }

  upsert(entity: Identifiable): Observable<T> {
    if (entity.id) {
      return this.http.put<T>(`${this.apiUrl}/${entity.id}/`, entity);
    }
    return this.http.post<T>(`${this.apiUrl}/`, entity);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }

  deleteSome(exclude: boolean, rowsIds: string[], filter: Record<string, any>): Observable<void> {
    const filterQuery = Object.keys(filter ?? {}).length > 0 ? `&${CrudService.filterToQuery(filter!)}` : '';
    return this.http.post<void>(`${this.apiUrl}/delete/?${filterQuery}`, {
      'excludeRows': exclude,
      'affectedRows': rowsIds,
    });
  }

  static filterToQuery(filter: FilterMeta): string {
    const createQueryParam = (field: string, {matchMode, value}: FilterMetadata): string | null => {
      if (value === null) return null;
      field = field.replace('.', '__');
      const postfix = (matchMode === undefined)
        ? ''
        : '_' + CrudService.matchModeToPostfix(matchMode ?? 'equals');
      return `${field}${postfix}=${value}`;
    };

    return Object.entries(filter)
      .flatMap(([field, meta]) => {
        if (Array.isArray(meta)) {
          return meta.map(item => createQueryParam(field, item)).filter(Boolean);
        }
        return createQueryParam(field, meta) ? [createQueryParam(field, meta)!] : [];
      })
      .join('&');
  }

  static orderingToQuery(ordering: Ordering[]): string {
    return ordering
      .map(({field, order}) => `${order === -1 ? '-' : ''}${field.replace('.', '__')}`)
      .join(',');
  }

  private static matchModeToPostfix(matchMode: string): string | undefined {
    if (matchMode === 'startsWith') {
      return 'starts_with';
    } else if (matchMode === 'endsWith') {
      return 'ends_with';
    } else if (matchMode === 'equals') {
      return 'equals';
    } else if (matchMode === 'notEquals') {
      return 'not_equals';
    } else if (matchMode === 'contains') {
      return 'contains';
    } else if (matchMode === 'notContains') {
      return 'not_contains';
    } else if (matchMode === 'in') {
      return 'in';
    } else if (matchMode === 'notIn') {
      return 'not_in';
    }
    return matchMode;
  }
}
