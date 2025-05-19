import {Component, inject, Input, TemplateRef} from '@angular/core';
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {ActivatedRoute, Router} from '@angular/router';
import {StringTemplateOutletDirective} from '../utils/string-template-outlet.directive';

@Component({
  selector: 'w-card',
  preserveWhitespaces: false,
  standalone: true,
  imports: [CardModule, StringTemplateOutletDirective, ButtonModule],
  template: `
    <p-card>
      <ng-template pTemplate="header">
        @if (header) {
          <div class="p-card-body !pb-0 !mb-0">
            <div class="p-card-title !pb-0 !mb-0 flex items-center gap-2">
              <p-button icon="pi pi-arrow-left"
                        (click)="back()"
                        [rounded]="true"
                        [text]="true"
                        severity="secondary"/>
              <ng-container *stringTemplateOutlet="header">{{ header }}</ng-container>
            </div>
          </div>
        }
      </ng-template>
      <ng-content></ng-content>
    </p-card>
  `,
})
export class CardComponent {
  @Input() header?: string | TemplateRef<void>;

  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);

  protected back(): void {
    this.router.navigate(['../'], {relativeTo: this.route});
  }
}
