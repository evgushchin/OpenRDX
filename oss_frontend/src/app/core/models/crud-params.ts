import {Ordering} from './ordering';

export interface CrudParams {
  filter?: Record<string, any>;
  order?: Ordering[];
}
