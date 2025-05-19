import {
  Directive,
  EmbeddedViewRef,
  Input,
  OnChanges,
  SimpleChange,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import {SafeAny} from '../models/types';

@Directive({
  selector: '[stringTemplateOutlet]',
  standalone: true,
})
export class StringTemplateOutletDirective<_T = unknown> implements OnChanges {
  private embeddedViewRef: EmbeddedViewRef<SafeAny> | null = null;
  private context = new StringTemplateOutletContext();
  @Input() stringTemplateOutletContext: SafeAny | null = null;
  @Input() stringTemplateOutlet: SafeAny | TemplateRef<SafeAny> = null;

  static ngTemplateContextGuard<T>(
    _dir: StringTemplateOutletDirective<T>,
    _ctx: SafeAny
  ): _ctx is StringTemplateOutletContext {
    return true;
  }

  private recreateView(): void {
    this.viewContainer.clear();
    if (isTemplateRef(this.stringTemplateOutlet)) {
      this.embeddedViewRef = this.viewContainer.createEmbeddedView(
        this.stringTemplateOutlet,
        this.stringTemplateOutletContext
      );
    } else {
      this.embeddedViewRef = this.viewContainer.createEmbeddedView(this.templateRef, this.context);
    }
  }

  private updateContext(): void {
    const newCtx = isTemplateRef(this.stringTemplateOutlet) ? this.stringTemplateOutletContext : this.context;
    const oldCtx = this.embeddedViewRef!.context as SafeAny;
    if (newCtx) {
      for (const propName of Object.keys(newCtx)) {
        oldCtx[propName] = newCtx[propName];
      }
    }
  }

  constructor(
    private viewContainer: ViewContainerRef,
    private templateRef: TemplateRef<SafeAny>
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { stringTemplateOutletContext, stringTemplateOutlet } = changes;
    const shouldRecreateView = (): boolean => {
      let shouldOutletRecreate = false;
      if (stringTemplateOutlet) {
        shouldOutletRecreate =
          stringTemplateOutlet.firstChange ||
          isTemplateRef(stringTemplateOutlet.previousValue) ||
          isTemplateRef(stringTemplateOutlet.currentValue);
      }
      const hasContextShapeChanged = (ctxChange: SimpleChange): boolean => {
        const prevCtxKeys = Object.keys(ctxChange.previousValue || {});
        const currCtxKeys = Object.keys(ctxChange.currentValue || {});
        if (prevCtxKeys.length === currCtxKeys.length) {
          for (const propName of currCtxKeys) {
            if (prevCtxKeys.indexOf(propName) === -1) {
              return true;
            }
          }
          return false;
        } else {
          return true;
        }
      };
      const shouldContextRecreate =
        stringTemplateOutletContext && hasContextShapeChanged(stringTemplateOutletContext);
      return shouldContextRecreate || shouldOutletRecreate;
    };

    if (stringTemplateOutlet) {
      this.context.$implicit = stringTemplateOutlet.currentValue;
    }

    const recreateView = shouldRecreateView();
    if (recreateView) {
      /** recreate view when context shape or outlet change **/
      this.recreateView();
    } else {
      /** update context **/
      this.updateContext();
    }
  }
}

export class StringTemplateOutletContext {
  public $implicit: SafeAny;
}

export function isTemplateRef<T>(value: TemplateRef<T> | SafeAny): value is TemplateRef<T> {
  return value instanceof TemplateRef;
}
