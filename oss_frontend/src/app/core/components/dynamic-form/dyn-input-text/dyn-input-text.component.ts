import {Component, Input} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {DynInputComponent} from '../dyn-input.directive';
import {DynLabelComponent} from '../dyn-label/dyn-label.component';
import {DynErrorComponent} from '../dyn-error/dyn-error.component';

@Component({
  selector: 'dyn-input-text',
  templateUrl: './dyn-input-text.component.html',
  preserveWhitespaces: false,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    DynLabelComponent,
    DynErrorComponent,
  ],
  standalone: true,
})
export class DynInputTextComponent extends DynInputComponent {
  @Input() autocomplete: string | undefined;
}
