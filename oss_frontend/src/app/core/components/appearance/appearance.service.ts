import {inject, Injectable} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {Observable, ReplaySubject} from 'rxjs';
import {CookieService} from 'ngx-cookie-service';
import {Appearance} from './appearance';

const COOKIE_KEY = 'appearance';

@Injectable({
  providedIn: 'root',
})
export class AppearanceService {
  private document: Document = inject(DOCUMENT);
  private appearance$ = new ReplaySubject<Appearance>(1);
  private appearance: Appearance = Appearance.Light;
  private cookieService: CookieService = inject(CookieService);


  constructor() {
    this.setInitialAppearance();
  }

  appearanceChanges(): Observable<Appearance> {
    return this.appearance$;
  }

  toggleAppearance(setCookie = true): void {
    const newAppearance = this.appearance === Appearance.Light ? Appearance.Dark : Appearance.Light;
    this.applyAppearance(newAppearance);
    this.appearance$.next(newAppearance)
    if (setCookie) {
      this.cookieService.set(COOKIE_KEY, newAppearance, 0.5); // 12 hours;
    }
  }

  private setInitialAppearance(): void {
    const savedAppearance = this.cookieService.get(COOKIE_KEY) as Appearance;
    if (savedAppearance) {
      this.appearance$.next(savedAppearance);
      this.applyAppearance(savedAppearance);
    } else {
      this.appearance$.next(Appearance.Light);
      if (this.isSystemDark()) {
        this.toggleAppearance(false);
      }
    }
  }

  private applyAppearance(appearance: Appearance): void {
    const element = document.querySelector('html');
    if (element) {
      if (appearance === Appearance.Dark) {
        element.classList.add('app-dark');
      } else {
        element.classList.remove('app-dark');
      }
    }

    this.appearance = appearance;
  }

  private isSystemDark(): boolean {
    return window?.matchMedia?.('(prefers-color-scheme:dark)')?.matches;
  }
}
