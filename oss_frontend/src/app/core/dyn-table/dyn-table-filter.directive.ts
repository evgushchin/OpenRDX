import {Directive, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';

@Directive({
  standalone: true,
  selector: '[dynTableFilter]'
})
export class DynTableFilterDirective implements OnChanges {
  @Input({required: true}) value: any;
  @Output() valueChanges = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] !== undefined && (this.value === null || this.value === undefined)) {
      this.valueChanges.next(this.value);
    }
  }
}
