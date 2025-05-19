import {ChangeDetectionStrategy, Component} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {Observable} from 'rxjs';
import {AppearanceService} from './appearance.service';
import {Appearance} from './appearance';

@Component({
    selector: 'appearance-toggle',
    changeDetection: ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false,
  imports: [AsyncPipe],
    template: `
      <button type="button"
              class="layout-topbar-action"
              (click)="toggleAppearance()">
        <i [class]="(appearance$ | async) === Appearance.Dark ? 'pi pi-sun' : 'pi pi-moon'"></i>
      </button>`
})
export class AppearanceToggleComponent {
  protected readonly Appearance = Appearance;

  constructor(private appearanceService: AppearanceService) {
  }

  get appearance$(): Observable<Appearance> {
    return this.appearanceService.appearanceChanges();
  }

  toggleAppearance(): void {
    this.appearanceService.toggleAppearance()
  }
}
