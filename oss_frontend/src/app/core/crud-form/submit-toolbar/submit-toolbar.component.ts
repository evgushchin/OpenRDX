import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';

@Component({
  selector: 'submit-toolbar',
  templateUrl: 'submit-toolbar.component.html',
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToolbarModule, ButtonModule]
})
export class SubmitToolbarComponent {
  @Input() showDelete = true;
  @Input() showSaveAndAddAnother = true;
  @Output() onSave = new EventEmitter<void>();
  @Output() onSaveAndAddAnother = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();
}
