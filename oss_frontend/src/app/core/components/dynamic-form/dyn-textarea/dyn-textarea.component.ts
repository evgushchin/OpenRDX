import {booleanAttribute, Component, Input, numberAttribute} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {TextareaModule} from 'primeng/textarea';
import {DynInputComponent} from '../dyn-input.directive';
import {DynLabelComponent} from '../dyn-label/dyn-label.component';
import {DynErrorComponent} from '../dyn-error/dyn-error.component';

@Component({
  selector: 'dyn-textarea',
  templateUrl: './dyn-textarea.component.html',
  preserveWhitespaces: false,
  imports: [
    ReactiveFormsModule,
    DynLabelComponent,
    DynErrorComponent,
    TextareaModule,
  ],
  standalone: true,
})
export class DynTextareaComponent extends DynInputComponent {
  @Input({ transform: numberAttribute }) rows: number = 5;
  @Input({ transform: numberAttribute }) cols: number = 30;
  @Input({ transform: booleanAttribute }) autoResize: boolean = false;
}
