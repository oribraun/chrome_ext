import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {Config} from "../../config";
import {IsActiveMatchOptions, Router} from "@angular/router";
import {MyRouter} from "../my.router";
import {MessagesService} from "../../services/messages.service";

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
    promptSettingsKey = 'right-click-prompt-settings';
    promptSettingLimit = 5;
    promptSettingsError = '';
    constructor(
        private apiService: ApiService,
        private messagesService: MessagesService,
        private config: Config,
        private router:MyRouter,
        private ref:ChangeDetectorRef
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
        this.getPromptSettingsApi();
        if (this.promptSettings.length) {
            this.savePrompt();
        }
        this.messagesService.ListenFor('change-header-page').subscribe((obj) => {
            this.currentPage = obj.page;
            // this.forceBindChanges();
        });
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
        }
    }

    async getPromptSettingsApi() {
        this.apiService.getSettings(this.promptSettingsKey).subscribe((res: any) => {
            if (!res.err) {
                for (let i =0; i < this.promptSettingLimit; i++) {
                    const idNum = i + 1;
                    const id = 'Custom' + idNum;
                    const obj = res.data[i]
                    if (obj) {
                        const title = obj.title;
                        const visible = obj.visible;
                        this.addPrompt(title, visible);
                    } else {
                        this.addPrompt('', false);
                    }
                }
            } else {
                console.log('error get settings')
            }
        }, (err) => {
            console.log('getSettings err', err)
        })
        this.setExtensionPrompts();
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

    savePromptToApi() {
        this.promptSettingsError = '';
        for (let i in this.promptSettings) {
            if (this.promptSettings[i].visible && !this.promptSettings[i].title) {
                this.promptSettingsError = 'your have enabled task with no title';
                return;
            }

        }
        // const tasksToSend = this.promptSettings.filter((o) => o.visible && o.title);
        // console.log('tasksToSend', tasksToSend)
        this.apiService.setSettings(this.promptSettingsKey, this.promptSettings).subscribe((obj: any) => {
            if (!obj.err) {
                console.log('setSettings obj', obj)
                this.setExtensionPrompts();
            } else {
                console.log('error get settings')
            }
        })
    }

    setExtensionPrompts() {
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
        this.messagesService.Broadcast('change-main-page', {page: page});
    }

    forceBindChanges() {
        if (chrome.runtime) {
            this.ref.detectChanges();
        }
    }

}
