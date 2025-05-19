import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import {FormControlStatus, FormsModule} from '@angular/forms';
import {finalize, Observable} from 'rxjs';
import {NgTemplateOutlet} from '@angular/common';
import {AutoCompleteCompleteEvent, AutoCompleteModule} from 'primeng/autocomplete';
import {DynLabelComponent} from '../dyn-label/dyn-label.component';
import {DynInputComponent} from '../dyn-input.directive';
import {DynDropdownOption} from './dyn-dropdown';
import {DynErrorComponent} from '../dyn-error/dyn-error.component';
import {Paginated} from '../../../models/paginated';

@Component({
  selector: 'dyn-dropdown',
  templateUrl: './dyn-dropdown.component.html',
  styleUrl: './dyn-dropdown.component.scss',
  preserveWhitespaces: false,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynLabelComponent,
    DynErrorComponent,
    AutoCompleteModule,
    FormsModule,
    NgTemplateOutlet,
  ],
  standalone: true,
})
export class DynDropdownComponent extends DynInputComponent implements OnInit, OnChanges {
  @Input({ transform: booleanAttribute }) showClear: boolean = false;
  @Input({ transform: booleanAttribute }) showFilter: boolean = false;
  @Input({ transform: booleanAttribute }) showCreateNew: boolean = false;
  @Input({ transform: booleanAttribute }) showDropdown: boolean = true;
  /** Allow multi-selection. */
  @Input({ transform: booleanAttribute }) multiple: boolean = false;
  @Input() options: DynDropdownOption[] = [];
  @Input() optionsLoader?: (pageNumber: number, filterQuery?: string) => Observable<Paginated<DynDropdownOption>>;
  @ContentChild(TemplateRef, { static: true }) itemTemplate!: TemplateRef<any>;

  /** The selected option (p-automcomplete model value). */
  protected selectedOption: DynDropdownOption[] = [];
  /** The state of the p-autocomplete: enabled or disabled. */
  protected isDisabled = false;

  private cachedOptions: DynDropdownOption[] = [];
  private changeDetectorRef = inject(ChangeDetectorRef);

  protected get isDynamic(): boolean {
    return this.optionsLoader != undefined;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.setSelectedOption(this.controller.value);
    this.isDisabled = this.controller.disabled;
    this.watchControlValueChanges();
    this.watchControlStateChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['optionsLoader'] && this.isDynamic) {
      this.getPage(1);
    } else {
      this.cachedOptions = [...this.options];
    }
  }

  /**
   * Handles the change event for the selected option.
   * It updates the controller's value to the last selected option.
   *
   * @return {void} This method does not return a value.
   */
  protected onSelectedOptionChange(): void {
    if (this.selectedOption == null) {
      this.selectedOption = [];
    }
    if (this.multiple) {
      this.controller.setValue(this.selectedOption);
    } else {
      this.controller.setValue(this.selectedOption.pop());
    }
    this.changeDetectorRef.detectChanges();
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
    const subscription = this.controller.valueChanges.subscribe((value: DynDropdownOption | DynDropdownOption[]) => {
      this.setSelectedOption(value);
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

  /**
   * Sets the selected dropdown option.
   *
   * @param {DynDropdownOption | DynDropdownOption[] | null | undefined} options - The option to be selected. Can be an instance of DynDropdownOption, null, or undefined.
   * @return {void}
   */
  private setSelectedOption(options: DynDropdownOption | DynDropdownOption[] | null | undefined): void {
    if (Array.isArray(options)) {
      this.selectedOption = options && options.length > 0 ? options : [];
    } else {
      this.selectedOption = options ? [options] : [];
    }
  }

  /** AutoComplete complete event handler */
  protected onAutoComplete(event: AutoCompleteCompleteEvent) {
    if (this.isDynamic) {
      if (this.showFilter) {
        this.getPage(1, event.query);
      }
    } else {
      this.options = this.cachedOptions.filter((option) => option.label.toLowerCase().includes(event.query.toLowerCase()));
    }
  }

  /** Dropdown focus handler */
  protected onFocus(): void {
    if (this.cachedOptions.length > 0 || !this.isDynamic) {
      this.options = [...this.cachedOptions];
      this.changeDetectorRef.detectChanges();
    } else {
      this.getPage(1);
    }
  }

  /** Dropdown click handler */
  protected onDropdownClick(): void {
    if (this.controller.value) {
      this.options = [...this.cachedOptions];
      this.changeDetectorRef.detectChanges();
    } else if (this.isDynamic) {
      this.getPage(1);
    }
  }

  /** Dropdown lazy loading handler */
  private getPage(page: number, filterQuery?: string): void {
    const subscription = this.optionsLoader!(page, filterQuery)
      .pipe(
        finalize(() => {
          this.changeDetectorRef.detectChanges();
        }),
      )
      .subscribe({
        next: (optionPage: Paginated<DynDropdownOption>) => {
          this.options = [...optionPage.results];
          if (optionPage.count > optionPage.results.length) {
            this.options = [...this.options, {
              id: 'invalid-value', // null and undefined are reserved for the empty value.
              label: 'Start typing to see more...',
              disabled: true,
            }];
          }

          if (page === 1 && !filterQuery) {
            this.cachedOptions = [...this.options];
          }

          if (filterQuery && this.showCreateNew) {
            this.addCreateNewOption(filterQuery);
          }
        },
        error: () => {
          this.options = [{
            id: 'invalid-value', // null and undefined are reserved for the empty value.
            label: 'Failed to load options',
            disabled: true,
          }];
        }
      });
    this.subscriptions.add(subscription);
  }

  /** Add "create new" option. */
  private addCreateNewOption(query: string): void {
    const createNewOption: DynDropdownOption = {
      label: `Create new (${query})`,
      createNew: true,
      id: query,
    };
    this.options = [createNewOption, ...this.options];
    this.changeDetectorRef.detectChanges();
  }
}
