import {Directive, Input, TemplateRef} from '@angular/core';
import {ReactiveControlDirective} from './reactive-control.directive';

@Directive()
export abstract class DynInputComponent extends ReactiveControlDirective {
  @Input() label?: string | TemplateRef<void>;
  @Input() placeholder?: string;
}
