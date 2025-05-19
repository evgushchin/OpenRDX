import {Component, Input, TemplateRef, ViewEncapsulation} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {DynLabelComponent} from '../dyn-label/dyn-label.component';
import {DynErrorComponent} from '../dyn-error/dyn-error.component';
import {ReactiveControlDirective} from '../reactive-control.directive';
import {InputTextModule} from 'primeng/inputtext';
import {CheckboxModule} from 'primeng/checkbox';

@Component({
  selector: 'dyn-checkbox',
  templateUrl: './dyn-checkbox.component.html',
  preserveWhitespaces: false,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ReactiveFormsModule,
    DynLabelComponent,
    DynErrorComponent,
    InputTextModule,
    CheckboxModule
  ],
  standalone: true,
})
export class DynCheckboxComponent extends ReactiveControlDirective {
  @Input() label?: string | TemplateRef<void>;
}
