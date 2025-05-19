import {Directive, inject, Input, OnDestroy, OnInit, Optional, Self} from '@angular/core';
import {ControlValueAccessor, FormControl, NgControl} from '@angular/forms';
import {first, keys} from 'lodash-es';
import {distinctUntilChanged, Subscription} from 'rxjs';

/**
 * Abstract directive that provides common functionality for reactive form controls.
 * Implements ControlValueAccessor to integrate with Angular forms.
 */
@Directive()
export abstract class ReactiveControlDirective implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() validationErrors?: Record<string, string>;
  @Self() @Optional() private control: NgControl = inject(NgControl);

  protected subscriptions = new Subscription();

  private get defaultValidationErrors(): Record<string, string> {
    return {
      'required': 'This field is required.',
      'minlength': `It must be at least ${this.getError('minlength')?.requiredLength} characters long.`,
      'maxlength': `It must be at most ${this.getError('maxlength')?.requiredLength} characters long.`,
      'email': 'Please enter a valid email address.',
    }
  }

  /** Function to call when the control value changes.  */
  onChange!: (value: any) => void;

  /** Function to call when the control is touched. */
  onTouched!: () => void;

  /** The FormControl instance associated with this directive. */
  protected controller!: FormControl;

  /** The name of the control, if available. */
  protected controlName: string | number | null = null;

  constructor() {
    if (this.control) {
      this.control.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    if (this.control) {
      this.controller = this.control.control as FormControl;
      this.controlName = this.control.name;
      this.subscribeToValueChanges();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Registers a function to call when the control value changes.
   * @param fn The function to call when the control value changes.
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * Registers a function to call when the control is touched.
   * @param fn The function to call when the control is touched.
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Writes a new value to the control.
   * @param value The new value to write to the control.
   */
  writeValue(value: any): void {
    if (this.controller) {
      this.controller.setValue(value, { emitEvent: false, emitModelToViewChange: false });
    }
  }

  /**
   * Sets the disabled state of the control.
   * @param isDisabled Whether the control should be disabled.
   */
  setDisabledState(isDisabled: boolean): void {
    if (this.controller && this.controller.disabled !== isDisabled) {
      isDisabled
        ? this.controller.disable({ onlySelf: true, emitEvent: false })
        : this.controller.enable({ onlySelf: true, emitEvent: false });
    }
  }

  /**
   * Returns validation error message if applicable.
   */
  getValidationErrorMessage(): string | undefined {
    const validationError = this.getFirstErrorKey();
    if (!validationError) return undefined;

    return this.validationErrors?.[validationError]
      ?? this.defaultValidationErrors[validationError]
      ?? validationError;
  }

  /**
   * Checks if a control has a specific error or if it is invalid and dirty.
   * @param errorCode The error code to check for (optional).
   * @returns True if the control has the specified error or is invalid and dirty, false otherwise.
   */
  hasErrors(errorCode?: string): boolean {
    return this.controller && (errorCode ? this.hasError(errorCode) : this.isInvalidOrDirty());
  }

  /**
   * Returns the error object for a specific error code.
   * @param errorCode The error code to get the error object for.
   * @returns The error object for the specified error code, or undefined if no error exists.
   */
  getError(errorCode: string): any {
    return this.controller ? this.controller.errors?.[errorCode] : undefined;
  }

  /**
   * Subscribes to value changes of the control and updates the value using onChange.
   * @private
   */
  private subscribeToValueChanges(): void {
    const subscription = this.controller.valueChanges.pipe(
      distinctUntilChanged(),
    ).subscribe((value: any) => {
      this.onChange(value);
    });
    this.subscriptions.add(subscription);
  }

  private getFirstErrorKey(): string | undefined {
    return this.controller && this.controller.errors ? first(keys(this.controller.errors)) : undefined;
  }

  /**
   * Checks if the control is invalid and dirty.
   * @returns True if the control is invalid and dirty, false otherwise.
   */
  private isInvalidOrDirty(): boolean {
    return this.controller.invalid && this.controller.dirty;
  }

  /**
   * Checks if the control has a specific error.
   * @param errorCode The error code to check for.
   * @returns True if the control has the specified error, false otherwise.
   */
  private hasError(errorCode: string): boolean {
    return this.controller.hasError(errorCode);
  }
}
