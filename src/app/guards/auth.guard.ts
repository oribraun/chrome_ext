import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';
import {Config} from "../config";

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(
        private config: Config,
        private router: Router
    ) {
    }
    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        // return new Promise((resolve, reject) => {
        //     console.log('this.config.user',this.config.user)
        //     this.config.user_subject.subscribe((user) => {
        //         console.log('this.config.user - user_subject',this.config.user)
        //         if (this.config.user) {
        //             resolve(true)
        //         } else {
        //             this.router.navigate(['/login'])
        //             resolve(false)
        //         }
        //     })
        //     setTimeout(() => {
        //         console.log('this.config.user - setTimeout',this.config.user)
        //         if (this.config.user) {
        //             resolve(true)
        //         } else {
        //             this.router.navigate(['/login'])
        //             resolve(false)
        //         }
        //     }, 200)
        // })
        // return true;
        // this.config.user_subject.subscribe((user) => {
        //     console.log('user', user)
        //     if (this.config.user) {
        //         this.router.navigate([''])
        //         return true;
        //     } else {
        //         this.router.navigate(['/login'])
        //         return false;
        //     }
        // })
        // console.log('this.config.user', this.config.user)
        if (this.config.user) {
            return true;
        } else {
            this.router.navigate(['/login'])
            return false;
        }
    }

}
