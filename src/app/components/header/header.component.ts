import { Component, OnInit } from '@angular/core';
import {ApiService} from "../../services/api.service";
import {ChromeExtensionService} from "../../services/chrome-extension.service";
import {Config} from "../../config";
import {IsActiveMatchOptions, Router} from "@angular/router";
import {MyRouter} from "../my.router";

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.less']
})
export class HeaderComponent implements OnInit {
    user: any;
    isCompany = false;
    routerLinkActiveOptions: IsActiveMatchOptions = {
        fragment: "exact",
        paths: "exact",
        queryParams: 'subset',
        matrixParams: 'subset'
    }
    constructor(
        private apiService: ApiService,
        private chromeExtensionService: ChromeExtensionService,
        private config: Config,
        private router:MyRouter,
    ) { }

    ngOnInit(): void {
        this.user = this.config.user;
        this.config.user_subject.subscribe((user) => {
            this.user = user;
            this.config.is_company = this.user.company_name;
        })
        // this.isCompany = this.user.company_name;
        // this.config.is_company_subject.subscribe((isCompany) => {
        //     this.isCompany = isCompany;
        // })
        return;
    }

    async logout(e: Event) {
        e.preventDefault();
        const response = await this.apiService.logout().toPromise();
        this.config.resetCookies();
        this.config.resetStorage();
        this.config.resetUserCreds();
        this.router.navigate(['/login'])
    }

    changePage(page: string) {
        this.chromeExtensionService.Broadcast('page-change', {page: page});
    }

}
