import {NavigationExtras, Router} from "@angular/router";
import {environment} from "@environment";
import {Injectable} from "@angular/core";

@Injectable()
export class MyRouter {
    constructor(
        readonly router: Router
    ) {
    }
    navigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
        if (environment.production) {
            extras = {skipLocationChange: true, ...extras}
            console.log('extras', extras)
        }
        return this.router.navigate(commands, extras);
    }
    get url() {
        return this.router.url;
    }
}
