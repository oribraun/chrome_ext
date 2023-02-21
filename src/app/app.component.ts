import {Component, OnDestroy, OnInit} from '@angular/core';
import {Config} from "./config";
import {ApiService} from "./services/api.service";
import {ChromeExtensionService} from "./services/chrome-extension.service";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit, OnDestroy {
    user: any;
    constructor(
        private config: Config,
        private apiService: ApiService,
        private chromeExtensionService: ChromeExtensionService
    ) {
        this.chromeExtensionService.listenToContentScriptMessages()
        this.setupCredsFromStorage();
    }

    ngOnInit(): void {
        // setTimeout(() => {
        //     this.setupCredsFromStorage();
        // })
        return;
    }



    async setupCredsFromStorage() {
        console.log('setupCredsFromStorage')
        const user = await this.config.getStorage('user', true);
        if (user) {
            this.config.user = JSON.parse(user);
            this.user = this.config.user;
            this.config.is_company = this.user.company_name
        } else {
            this.config.user_subject.next('');
        }
        const token = await this.config.getStorage('token', true);
        if (token) {
            this.config.token = token;
        }
        this.config.user_subject.subscribe((user) => {
            this.user = this.config.user;
            this.config.is_company = this.user.company_name
        })
    }

    async setupCredsFromCookies() {
        // if (typeof STATIC_URL !== 'undefined' && STATIC_URL !== "{% static 'client/' %}") {
        //   this.config.staticServerPath = STATIC_URL;
        // }
        // if (typeof USER !== 'undefined' && USER !== 'AnonymousUser' && USER !== '{{ user | safe }}') {
        //     this.config.user = JSON.parse(USER);
        // } else {
        //     this.config.user_subject.next('');
        // }
        // console.log('csrf_token', TOKEN)
        // if (typeof TOKEN !== 'undefined' && TOKEN !== '{{ csrf_token }}') {
        //     this.config.csrf_token = TOKEN;
        // }
        console.log('setupCredsFromCookies')
        const user = await this.config.getCookie('user', true);
        if (user) {
            this.config.user = JSON.parse(user);
            this.user = this.config.user;
            this.config.is_company = this.user.company_name
        } else {
            this.config.user_subject.next('');
        }
        // const csrftoken = await this.config.getCookie('csrftoken', true);
        // if (csrftoken) {
        //     this.config.csrf_token = csrftoken;
        // }
        const token = await this.config.getCookie('token', true);
        if (token) {
            this.config.token = token;
        }
        // const csrftoken = await this.config.getCookie('csrftoken', true);
        // const token = await this.config.getCookie('token', true);
        // const user = await this.config.getCookie('user', true);
        // if (csrftoken) {
        //     this.config.csrf_token = csrftoken;
        // }
        // if (token) {
        //     this.config.token = token;
        // }
        // if (user) {
        //     this.config.user = JSON.parse(user);
        //     this.user = this.config.user;
        // } else {
        //     this.config.user_subject.next('');
        // }

        this.config.user_subject.subscribe((user) => {
            this.user = this.config.user;
            this.config.is_company = this.user.company_name
        })
    }

    ngOnDestroy(): void {
        this.chromeExtensionService.removeListenToContentScriptMessages();
    }


}
