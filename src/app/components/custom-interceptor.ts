import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {catchError, Observable, throwError} from "rxjs";
import {Config} from "../config";
import {ChromeExtensionService} from "../services/chrome-extension.service";
import {Router} from "@angular/router";
import {MyRouter} from "./my.router";
import {ApiService} from "../services/api.service";

@Injectable()
export class CustomInterceptor implements HttpInterceptor {

    constructor(
        private config: Config,
        private chromeExtensionService: ChromeExtensionService,
        private apiService: ApiService,
        private router: MyRouter
    ) {
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        // request = request.clone({
        //     withCredentials: true
        // });
        return next.handle(request)
            .pipe(
                catchError((error: HttpErrorResponse) => {
                    let errorMsg = '';
                    if (error.error instanceof ErrorEvent) {
                        // console.log('This is client side error');
                        errorMsg = `Error: ${error.error.message}`;
                    } else {
                        // console.log('This is server side error');
                        errorMsg = `Error Code: ${error.status},  Message: ${error.message}`;
                    }
                    if (error.status === 403) {
                        if (error && error.error && error.error.detail === "Invalid token.") {
                            console.log('Forbidden');
                            this.clearAndRedirectToLogin();
                        }
                        if (error && error.error && error.error.detail === "CSRF Failed: CSRF cookie not set.") {
                            console.log('Forbidden');
                            if (request.url.indexOf('auth/logout') === -1) {
                                this.apiService.logout().subscribe(() => {
                                    this.clearAndRedirectToLogin();
                                }, (err) => {
                                    this.clearAndRedirectToLogin();
                                })
                            }
                        }
                    }
                    if (error.status === 401) {
                        console.log('Unauthorized');
                        this.clearAndRedirectToLogin();
                    }
                    console.log('errorMsg',errorMsg);
                    return throwError(errorMsg);
                })
            )
    }

    clearAndRedirectToLogin() {
        this.config.resetCookies();
        this.config.resetStorage();
        this.config.resetUserCreds();
        if (chrome.tabs) {
            this.chromeExtensionService.sendMessageToContentScript('login-required', {})
            this.chromeExtensionService.showSidebar('clearAndRedirectToLogin');
        }
        this.router.navigate(['/login']);
    }
}
