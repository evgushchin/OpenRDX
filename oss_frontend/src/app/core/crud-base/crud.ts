import {Directive, inject, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {ConfirmationService, MessageService} from 'primeng/api';
import {CrudService} from '../services/crud.service';
import {Identifiable} from '../models/identifiable';

@Directive()
export class Crud<EntityType extends Identifiable> implements OnDestroy {
  protected confirmationService: ConfirmationService = inject(ConfirmationService);
  protected messageService: MessageService = inject(MessageService);
  protected router: Router = inject(Router);
  protected route: ActivatedRoute = inject(ActivatedRoute);
  protected subscriptions = new Subscription();

  /**
   * Constructor for CrudBaseComponent.
   * @param crudService - The CRUD service for the entity type.
   */
  constructor(protected crudService: CrudService<EntityType>) {
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Navigates to the item creation page.
   */
  protected createItem(): void {
    this.router.navigate(['./add'], { relativeTo: this.route });
  }

  /**
   * Navigates to the item update page.
   * @param item - The entity to be updated.
   */
  protected updateItem(item: EntityType): void {
    this.router.navigate(['./', item.id], { relativeTo: this.route, state: item });
  }

  /**
   * Deletes an item from the system.
   * @param item - The entity to be deleted.
   */
  protected deleteItem(item: EntityType): void {
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
      accept: () => this.deleteEntity(item),
    });
  }

  /**
   * Shows a success toast with a message.
   * @param message - The success message
   * @protected
   */
  protected showSuccessMessage(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: message,
      closable: true,
    });
  }

  /**
   * Show an error toast with a message.
   * @param message - The error message.
   */
  protected showErrorMessage(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      closable: true,
    });
  }

  protected onEntityDeletedSuccessfully(): void {
    // Not implemented.
  }

  /**
   * Deletes the entity.
   * @param entity - The entity to be deleted.
   */
  private deleteEntity(entity: EntityType): void {
    if (entity?.id === undefined) {
      return;
    }
    const subscription = this.crudService.delete(entity.id!).subscribe({
      next: () => {
        this.showSuccessMessage('El registro se ha eliminado correctamente.');
        this.onEntityDeletedSuccessfully();
      },
      error: ({ error }) => this.showErrorMessage(error.message)
    });
    this.subscriptions.add(subscription);
  }
}
