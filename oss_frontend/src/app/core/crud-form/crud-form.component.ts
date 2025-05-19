import {ChangeDetectorRef, Directive, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {finalize, forkJoin, Observable, ReplaySubject, Subscription} from 'rxjs';
import {ConfirmationService, MessageService} from 'primeng/api';
import {CrudService} from '../services/crud.service';
import {Identifiable} from '../models/identifiable';
import {FormService} from '../components/dynamic-form/form.service';

@Directive()
export abstract class CrudFormComponent<EntityType extends Identifiable, FormType extends { [K in keyof FormType]: AbstractControl; } = any> implements OnInit, OnDestroy {
  @Input() entity?: EntityType;

  get form(): FormGroup<FormType> {
    return this.formService.form;
  }

  // Inject Angular providers.
  protected router: Router = inject(Router);
  protected route: ActivatedRoute = inject(ActivatedRoute);
  protected changeDetectorRef: ChangeDetectorRef = inject(ChangeDetectorRef);
  protected messageService: MessageService = inject(MessageService);
  protected confirmationService: ConfirmationService = inject(ConfirmationService);

  protected formReady = new ReplaySubject<boolean>(1);
  protected dataReady = new ReplaySubject<boolean>(1);

  /** Set it when you need to force fetching data from an API.  */
  protected forceToFetchData = false;

  protected subscriptions = new Subscription();

  protected constructor(
    protected formService: FormService,
    protected crudService: CrudService<EntityType>) {
    this.setDataFromRoute();
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSave(andAddAnother: boolean = false): void {
    if (!this.formService.validate()) {
      return;
    }

    const formValue: Identifiable = this.formService.getFormValue(this.entity);
    this.formService.formLock();
    const subscription = this.crudService.upsert(formValue)
      .pipe(finalize(() => this.formService.formUnlock()))
      .subscribe({
        next: () => this.handleSaveSuccess(andAddAnother),
        error: ({ error }) => this.handleError(error.message)
      });
    this.subscriptions.add(subscription);
  }

  onDelete(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar este registro?',
      header: 'Confirmación de Eliminación',
      acceptIcon: "none",
      rejectIcon: "none",
      icon: "pi pi-exclamation-triangle",
      acceptButtonStyleClass: "p-button-danger",
      acceptLabel: "Borrar",
      rejectLabel: "Cancelar",
      rejectButtonStyleClass: "p-button-text p-button-plain",
      defaultFocus: "reject",
      accept: () => this.deleteEntity(),
    });
  }

  protected handleSaveSuccess(andAddAnother: boolean): void {
    const performedAction = this.entity ? 'cambiado' : 'agregado';
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `El registro fue ${performedAction} correctamente.`,
      closable: true,
    });
    if (andAddAnother) {
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['../', 'add'], { relativeTo: this.route });
      });
    } else {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }

  protected handleError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      closable: true,
    });
  }

  private initializeForm(): void {
    this.watchForFormReady();
    const formBuilder = this.formService.buildForm();

    const formReadyCallback = () => {
      this.formReady.next(true);
      this.watchForItemIdInParameters();
    };

    if (formBuilder instanceof Observable) {
      this.subscriptions.add(
        formBuilder.subscribe(formReadyCallback)
      );
    } else {
      formReadyCallback();
    }
  }

  private watchForFormReady(): void {
    const subscription = forkJoin([this.formReady, this.dataReady]).subscribe(() => {
      this.patchForm();
    });
    this.subscriptions.add(subscription);
  }

  /** Deletes the entity. */
  private deleteEntity(): void {
    if (this.entity?.id === undefined) {
      return;
    }
    const subscription = this.crudService.delete(this.entity.id!).subscribe({
      next: () => this.handleDeleteSuccess(),
      error: ({ error }) => this.handleError(error.message)
    });
    this.subscriptions.add(subscription);
  }

  private handleDeleteSuccess(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'El registro se ha eliminado correctamente.',
      closable: true,
    });
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  /** Sets the data from the route to the model. */
  private setDataFromRoute(): void {
    const navigation = this.router.getCurrentNavigation();
    this.entity = navigation?.extras.state as EntityType ?? null;
  }

  private watchForItemIdInParameters(): void {
    if (!this.entity || this.forceToFetchData) {
      const subscription = this.route.params.subscribe(params => {
        if (params['id']) {
          this.loadModelById(params['id']);
        }
      });
      this.subscriptions.add(subscription);
    } else {
      this.patchForm();
    }
  }

  private loadModelById(id: string): void {
    this.formService.formLock();
    const subscription = this.crudService.getById(id).pipe(
      finalize(() => {
        this.formService.formUnlock();
        this.changeDetectorRef.detectChanges();
      }),
    ).subscribe({
      next: (model: EntityType) => this.handleModelLoadSuccess(model),
      error: ({ error }) => this.handleError(error.message),
    });
    this.subscriptions.add(subscription);
  }

  private handleModelLoadSuccess(model: EntityType): void {
    this.entity = model;
    this.patchForm();
  }

  /** Patches the form with the entity data. */
  private patchForm(): void {
    if (this.entity !== null) {
      this.formService.patchValue(this.entity);
    }
    this.dataReady.next(true);
  }
}
