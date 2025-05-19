import {Component, Input, ViewEncapsulation} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {InputNumberModule} from 'primeng/inputnumber';
import {DynInputComponent} from '../dyn-input.directive';
import {DynLabelComponent} from '../dyn-label/dyn-label.component';
import {DynErrorComponent} from '../dyn-error/dyn-error.component';

@Component({
  selector: 'dyn-input-number',
  templateUrl: './dyn-input-number.component.html',
  preserveWhitespaces: false,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ReactiveFormsModule,
    DynLabelComponent,
    DynErrorComponent,
    InputNumberModule,
  ],
  standalone: true,
})
export class DynInputNumberComponent extends DynInputComponent {
  @Input() autocomplete: string | undefined;
  @Input() prefix: string | undefined;
}
