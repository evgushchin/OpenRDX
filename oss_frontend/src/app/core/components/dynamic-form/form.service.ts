import {AbstractControl, FormGroup, UntypedFormGroup} from '@angular/forms';
import {keys} from 'lodash-es';
import {Observable} from 'rxjs';
import {Identifiable} from '../../models/identifiable';

export abstract class FormService<T extends { [K in keyof T]: AbstractControl; } = any> {
  private formGroup!: FormGroup<T>;

  get form(): FormGroup<T> {
    return this.formGroup;
  }

  protected set form(form: FormGroup<T>) {
    this.formGroup = form;
  }

  abstract buildForm(): FormGroup<T> | Observable<FormGroup<T>>;

  patchValue(entity: any, emitEvent = false): void {
    this.form.patchValue(entity, { emitEvent });
  }

  getFormValue(entity: object | undefined = undefined): any & Identifiable {
    return { ...entity, ...this.form.value };
  }

  /** Validates a form. */
  validate(form: UntypedFormGroup = this.form): boolean {
    const controls = keys(form.controls);
    controls.forEach((ctrl: string) => {
      const control = form.get(ctrl);
      if ((control as UntypedFormGroup).controls) {
        this.validate(control as UntypedFormGroup);
      } else {
        control?.markAsDirty();
        control?.updateValueAndValidity();
      }
    });

    return form.status === 'VALID';
  }

  /** Lock the login input forms */
  formLock(form: UntypedFormGroup = this.form, emitEvent = true): void {
    const controls = keys(form.controls);
    controls.forEach((ctrl) => {
      const control = form.get(ctrl);
      if ((control as UntypedFormGroup).controls) {
        this.formLock(control as UntypedFormGroup, emitEvent);
      } else {
        form.get(ctrl)?.disable({ emitEvent });
      }
    });
  }

  /** Lock the login input forms */
  formUnlock(form: UntypedFormGroup = this.form, emitEvent = true): void {
    const controls = keys(form.controls);
    controls.forEach((ctrl) => {
      const control = form.get(ctrl);
      if ((control as UntypedFormGroup).controls) {
        this.formUnlock(control as UntypedFormGroup, emitEvent);
      } else {
        form.get(ctrl)?.enable({ emitEvent });
      }
    });

    this.emitValueChangeEvent(form);
  }

  /** Emit value change event for all form controls */
  private emitValueChangeEvent(form: UntypedFormGroup = this.form): void {
    const controls = keys(form.controls);
    controls.forEach((ctrl) => {
      const control = form.get(ctrl);
      if ((control as UntypedFormGroup).controls) {
        this.emitValueChangeEvent(control as UntypedFormGroup);
      } else {
        control?.updateValueAndValidity({ emitEvent: true });
      }
    });
  }
}
