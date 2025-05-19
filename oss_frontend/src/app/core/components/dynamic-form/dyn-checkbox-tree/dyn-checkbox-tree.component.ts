import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import {FormControlStatus, ReactiveFormsModule} from '@angular/forms';
import {finalize, Observable} from 'rxjs';
import {TreeNode} from 'primeng/api';
import {Tree} from 'primeng/tree';
import {DynErrorComponent} from '../dyn-error/dyn-error.component';
import {DynLabelComponent} from '../dyn-label/dyn-label.component';
import {DynInputComponent} from '../dyn-input.directive';

@Component({
  selector: 'dyn-checkbox-tree',
  templateUrl: './dyn-checkbox-tree.component.html',
  preserveWhitespaces: false,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DynErrorComponent,
    DynLabelComponent,
    Tree,
  ],
  standalone: true,
})
export class DynCheckboxTreeComponent extends DynInputComponent implements OnInit, OnChanges {
  @Input() options: TreeNode[] = [];
  @Input() optionsLoader?: () => Observable<TreeNode[]>;

  /** The selected option (tree model value). */
  protected selectedNodes: TreeNode[] = [];
  /** The state of the tree: enabled or disabled. */
  protected isDisabled = false;
  protected loading = false;

  private changeDetectorRef = inject(ChangeDetectorRef);

  protected get isDynamic(): boolean {
    return this.optionsLoader != undefined;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.setSelectedOptions(this.controller.value);
    this.isDisabled = this.controller.disabled;
    this.watchControlValueChanges();
    this.watchControlStateChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['optionsLoader'] && this.isDynamic) {
      this.loadTree();
    }
  }

  protected onSelectionChange(event: any): void {
    this.selectedNodes = event;
    this.onChange(this.selectedNodes);
  }

  /**
   * Monitors changes to the controller's value and updates the selected option accordingly.
   *
   * This method subscribes to the valueChanges observable of the controller. When a change
   * in the value is detected, the setSelectedOption method is called with the new value.
   * The subscription is then added to the list of subscriptions for proper cleanup.
   *
   * @return {void} No return value.
   */
  private watchControlValueChanges(): void {
    const subscription = this.controller.valueChanges.subscribe((value: TreeNode[]) => {
      this.setSelectedOptions(value);
    });
    this.subscriptions.add(subscription);
  }

  private watchControlStateChanges(): void {
    const subscription = this.controller.statusChanges.subscribe((status: FormControlStatus) => {
      this.isDisabled = status === 'DISABLED';
      this.changeDetectorRef.detectChanges();
    });
    this.subscriptions.add(subscription);
  }

  /** Load options from the server. */
  private loadTree(): void {
    this.loading = true;
    const subscription = this.optionsLoader!()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetectorRef.detectChanges();
        }),
      ).subscribe({
        next: (options: TreeNode[]) => {
          this.options = options;
        },
        error: () => {
          this.options = [{
            key: 'error',
            label: 'Error loading options',
            data: null,
            children: [],
          }];
        },
      });

    this.subscriptions.add(subscription);
  }

  /** Set the selected option. */
  private setSelectedOptions(options: TreeNode[]): void {
    this.selectedNodes = options || [];
  }
}
