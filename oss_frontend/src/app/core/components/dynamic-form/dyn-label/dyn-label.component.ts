import {Component, Input, TemplateRef, ViewEncapsulation} from '@angular/core';
import {StringTemplateOutletDirective} from '../../../utils/string-template-outlet.directive';

@Component({
  selector: 'dyn-label',
  templateUrl: 'dyn-label.component.html',
  preserveWhitespaces: false,
  encapsulation: ViewEncapsulation.None,
  imports: [StringTemplateOutletDirective],
  standalone: true,
})
export class DynLabelComponent {
  @Input() label?: string | TemplateRef<void>;
  @Input() htmlFor?: string | number | null;
}
