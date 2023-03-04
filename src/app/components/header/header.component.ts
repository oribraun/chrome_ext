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
    currentPage = 'privacy-model'
    routerLinkActiveOptions: IsActiveMatchOptions = {
        fragment: "exact",
        paths: "exact",
        queryParams: 'subset',
        matrixParams: 'subset'
    }
    promptSettings: any[] = [
        // {title: 'test'}
    ];
    promptSettingLimit = 5;
    promptSettingsError = '';
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
        this.getPromptSettings();
        return;
    }

    async getPromptSettings() {
        if (chrome.storage) {
            for (let i =0; i < 5; i++) {
                const idNum = i + 1;
                const id = 'Custom' + idNum;
                const obj = await chrome.storage.sync.get(id)
                if (obj && obj[id]) {
                    const title = obj[id].title;
                    const visible = obj[id].visible;
                    this.addPrompt(title, visible);
                } else {
                    this.addPrompt('', false);
                }
            }
            if (this.promptSettings.length) {
                this.savePrompt();
            }

        }
    }

    addPrompt(text: string = '', visible = true) {
        if (this.promptSettings.length < this.promptSettingLimit) {
            this.promptSettings.push({
                title: text,
                visible: visible,
            })
        }
    }
    removePrompt(index: number) {
        this.promptSettings.splice(index, 1);
    }

    savePrompt() {
        this.promptSettingsError = '';
        for (let i in this.promptSettings) {
            if (this.promptSettings[i].visible && !this.promptSettings[i].title) {
                this.promptSettingsError = 'your have enabled task with no title';
                return;
            }

        }
        // const tasksToSend = this.promptSettings.filter((o) => o.visible && o.title);
        // console.log('tasksToSend', tasksToSend)
        if (chrome.runtime) {
            chrome.runtime.sendMessage({
                type: "UPDATE_CUSTOM_PROMPT",
                arr: this.promptSettings
            })
        }
    }

    async logout(e: Event) {
        e.preventDefault();
        const response = await this.apiService.logout().toPromise().catch((err) => {});
        this.config.resetCookies();
        this.config.resetStorage();
        this.config.resetUserCreds();
        this.promptSettings = [];
        this.savePrompt();
        this.router.navigate(['/login'])
    }

    settings(e: Event) {
        e.preventDefault();
        if (chrome.runtime) {
            chrome.runtime.sendMessage({
                type: "UPDATE_CUSTOM_PROMPT",
                arr: [{
                    title: 'Explain',
                }]
            })
        }
    }

    changePage(event: Event, page: string) {
        event.preventDefault();
        this.currentPage = page;
        this.chromeExtensionService.Broadcast('page-change', {page: page});
    }

}
