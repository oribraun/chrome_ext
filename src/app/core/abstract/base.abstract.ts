import { OnDestroy, Directive } from '@angular/core';
import { AppInjector } from '@core/configs/app-injector';
import { OptionsService } from '@core/services/options.service';
import { Subscription } from 'rxjs';
import {Router} from "@angular/router";
import {MyRouter} from "../../components/my.router";

@Directive()
export class BaseAbstract implements OnDestroy {

    protected subs: { [key: string]: Subscription } = {};
    protected timeouts: { [key: string]: any } = {};
    protected optionsService: OptionsService;

    constructor(
        private router: MyRouter
    ) {
        this.optionsService = AppInjector.injector.get(OptionsService);
    }

    ngOnDestroy(): void {
        Object.values(this.subs).forEach((sub: Subscription) => {
            if (!!sub && !!sub.unsubscribe) {
                sub.unsubscribe();
            }
        });
        Object.values(this.timeouts).forEach((timeout: any) => {
            if (!!timeout) {
                clearTimeout(timeout);
            }
        });
    }

    openOptionsPage(): void {
        if(chrome.runtime) {
            chrome.runtime.openOptionsPage(() => {
                console.log('Option page opened')
            });
        } else {
            this.router.navigate(['options'])
        }
    }
}
