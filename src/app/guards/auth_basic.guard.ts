import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';
import {AuthGuard} from "./auth.guard";
import {Config} from "../config";
import {MyRouter} from "../components/my.router";

@Injectable({
    providedIn: 'root'
})
export class AuthBasicGuard implements CanActivate {

    TRAIL = 1
    BASIC = 2
    ADVANCE =3
    PRO =3
    constructor(
        private config: Config,
        private router: MyRouter
    ) {
    }
    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

        this.config.user_subject.subscribe((user) => {
            if (this.config.user && 'role' in this.config.user && this.config.user.role >= this.TRAIL) {
                return true;
            } else {
                this.router.navigate([''])
                return false;
            }
        })
        return true
    }

}
