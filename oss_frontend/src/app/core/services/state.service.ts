import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, throwError} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private readonly _$states: Map<string, BehaviorSubject<any>> = new Map([]);

  /**   Set a state property value */
  set(key: string, value: any): StateService {
    if (this._$states.has(key)) {
      this._$states.get(key)!.next(value);
    } else {
      this._$states.set(key, new BehaviorSubject(value));
    }
    return this;
  }

  /** Return the value of a specific state property */
  get(key: string): any {
    return !this._$states.has(key) ? null : this._$states.get(key)!.getValue();
  }

  /** Getter for the node list attribute */
  getObservable(key: string): Observable<any> {
    if (!this._$states.has(key)) {
      return throwError(() => new Error(`App State property key "${key}" not found.`));
    }

    return this._$states.get(key)!.asObservable();
  }
}
