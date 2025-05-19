import {booleanAttribute, Component, Input, ViewEncapsulation} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {PasswordModule} from 'primeng/password';
import {DynInputComponent} from '../dyn-input.directive';
import {DynLabelComponent} from '../dyn-label/dyn-label.component';
import {DynErrorComponent} from '../dyn-error/dyn-error.component';

@Component({
  selector: 'dyn-input-password',
  templateUrl: './dyn-input-password.component.html',
  preserveWhitespaces: false,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ReactiveFormsModule,
    DynLabelComponent,
    PasswordModule,
    DynErrorComponent,
  ],
  standalone: true,
})
export class DynInputPasswordComponent extends DynInputComponent {
  @Input({ transform: booleanAttribute }) toggleMask: boolean = false;
  @Input({ transform: booleanAttribute }) showStrengthMeter: boolean = false;
  @Input() autocomplete: string | undefined;
}
