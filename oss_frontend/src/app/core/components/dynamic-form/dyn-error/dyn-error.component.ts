import {ChangeDetectionStrategy, Component, Input, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'dyn-error',
  templateUrl: './dyn-error.component.html',
  preserveWhitespaces: false,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynErrorComponent {
  @Input({required: true}) hasErrors: boolean = false;
  @Input({required: true}) errorMessage?: string = undefined;
}
