import {HttpParams} from '@angular/common/http';

export class HttpInterceptorParams extends HttpParams {
  /**
   * Indicates if the interceptor should handle 401 error navigation.
   * By default, it does all the job, i.e. HttpInterceptor will catch the error and will navigate the
   * user to login page.
   * The default value is true.
   */
  private shouldRedirectToLoginPageOn401Error = true;

  /**
   * Enables (sets to default state) auto-redirect to login page on 401 error
   */
  enableRedirectToLoginOn401Error() {
    this.shouldRedirectToLoginPageOn401Error = true;
  }

  /**
   * Disables auto-redirect to login page on 401 error
   */
  disableRedirectToLoginOn401Error() {
    this.shouldRedirectToLoginPageOn401Error = false;
  }

  /**
   * Checks whether the redirect is enabled or not
   */
  isEnabledRedirectToLoginOn401Error(): boolean {
    return this.shouldRedirectToLoginPageOn401Error;
  }
}
