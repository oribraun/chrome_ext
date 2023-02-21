import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {catchError, Observable, throwError} from "rxjs";
import {Config} from "../config";
import {ChromeExtensionService} from "../services/chrome-extension.service";
import {Router} from "@angular/router";

@Injectable()
export class CustomInterceptor implements HttpInterceptor {

    constructor(
        private config: Config,
        private chromeExtensionService: ChromeExtensionService,
        private router: Router
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
                    if (error.status === 401) {
                        console.log('Unauthorized');
                        this.clearAndRedirectToLogin();
                    }
                    console.log(errorMsg);
                    return throwError(errorMsg);
                })
            )
    }

    clearAndRedirectToLogin() {
        this.config.resetCookies();
        this.config.resetUserCreds();
        if (chrome.tabs) {
            this.chromeExtensionService.sendMessageToContentScript('login-required', {})
            this.chromeExtensionService.showSidebar();
        }
        this.router.navigate(['/login']);
    }
}
