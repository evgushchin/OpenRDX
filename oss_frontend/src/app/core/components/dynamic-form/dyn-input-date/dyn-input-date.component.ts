import {booleanAttribute, Component, Input} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {DatePickerModule, DatePickerTypeView} from 'primeng/datepicker';
import {DynInputComponent} from '../dyn-input.directive';
import {DynLabelComponent} from '../dyn-label/dyn-label.component';
import {DynErrorComponent} from '../dyn-error/dyn-error.component';

@Component({
  selector: 'dyn-input-date',
  templateUrl: './dyn-input-date.component.html',
  preserveWhitespaces: false,
  styles: [`
    ::ng-deep .p-datepicker .p-datepicker-month-view {
      white-space: initial !important;
    }
  `],
  imports: [
    ReactiveFormsModule,
    DynLabelComponent,
    DynErrorComponent,
    DatePickerModule,
  ],
  standalone: true,
})
export class DynInputDateComponent extends DynInputComponent {
  @Input({transform: booleanAttribute}) showClear: boolean = false;
  @Input({transform: booleanAttribute}) readonlyInput: boolean = false;
  @Input({transform: booleanAttribute}) timeOnly: boolean = false;
  @Input({transform: booleanAttribute}) showSeconds: boolean = false;
  /** Whether to display timepicker. */
  @Input({transform: booleanAttribute}) showTime: boolean = false;
  @Input() dateFormat: string | undefined = undefined;
  @Input() hourFormat: '24' | '12' = '24';
  @Input() selectionMode: 'range' | 'single' | 'multiple' = 'single';
  /** Maximum number of selectable dates in multiple mode. */
  @Input() maxDateCount: number | null = null;
  /** Array with dates that should be disabled (not selectable). */
  @Input() disabledDates: Date[] = [];
  /** Array with weekday numbers that should be disabled (not selectable). */
  @Input() disabledDays: number[] = [];
  @Input() minDate: Date | undefined = undefined;
  @Input() maxDate: Date | undefined = undefined;
  /** Type of view to display, valid values are "date" for datepicker and "month" for month picker.  */
  @Input() view: DatePickerTypeView = 'date';
}
