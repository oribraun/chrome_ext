import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Config} from "../../config";
import {ApiService} from "../../services/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {lastValueFrom} from "rxjs";
import {ChromeExtensionService} from "../../services/chrome-extension.service";

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit {
    formType = 'login';
    formTypeOptions = ['login', 'register', 'forgot'];
    email: string = '';
    password: string = '';
    username: string = '';
    baseApi = 'http://localhost:8000/api/auth/';
    user: any = {};
    loginErr = '';

    constructor(
        private http: HttpClient,
        private config: Config,
        private apiService: ApiService,
        private chromeExtensionService: ChromeExtensionService,
        private router: Router,
        private route: ActivatedRoute
    ) {
    }

    ngOnInit(): void {
        this.checkUser();
        this.config.user_subject.subscribe((user) => {
            this.checkUser();
        })
        this.route.paramMap.subscribe((paramMap) => {
            const type = paramMap.get('type')
            if (type && this.formTypeOptions.indexOf(type) > -1) {
                this.formType = type;
            }
        })
        // this.listenToChromeContentScriptMessages();
    }

    checkUser() {
        if (!this.config.user) {
            this.chromeExtensionService.showSidebar();
        } else {
            this.redirectFromLoginPage();
        }
    }

    redirectFromLoginPage() {
        if(this.config.user) {
            // setTimeout(() => {
                this.router.navigate([''])
            // })
        }
    }

    listenToChromeContentScriptMessages() {
        // this.chromeExtensionService.ListenFor('init').subscribe((obj) => {
        //
        // })
        // this.chromeExtensionService.listenToMessages.subscribe((obj) => {
        //     const request = obj.request;
        //     const sender = obj.sender;
        //     const sendResponse = obj.sendResponse;
        //     // console.log('login this.config.user', this.config.user)
        //     if (!this.config.user) {
        //         this.chromeExtensionService.showSidebar();
        //     }
        // })
    }
    async login() {
        try {
            this.loginErr = '';
            const response: any = await lastValueFrom(this.apiService.login(this.email,this.password));
            if (!response.err) {
                const data = response.data;
                this.setupUser(data);
                this.chromeExtensionService.hideSidebar();
                this.router.navigate([''])
            } else {
                this.loginErr = response.errMessage;
            }
        } catch (error) {
            console.error(error);
        }
    }

    async register() {
        try {
            this.loginErr = '';
            const response: any = await this.apiService.register(this.email, this.username, this.password).toPromise();
            if (!response.err) {
                const data = response.data;
                this.setupUser(data);
                this.chromeExtensionService.hideSidebar();
                this.router.navigate(['/'])
            } else {
                if (Array.isArray(response.errMessage)) {
                     this.loginErr = response.errMessage.join('</br>');
                } else {
                    this.loginErr = response.errMessage;
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    async forgot() {
        try {
            const response: any = await lastValueFrom(this.apiService.forgotPassword(this.email));
            if (!response.err) {
                console.log('email sent successfully, please check your email')
            }
        } catch (error) {
            console.error(error);
        }
    }

    setupUser(response: any) {
        this.user = response;
        this.config.user = response.user;
        this.config.token = response.token;
        // this.setCookiesAfterLogin(response);
        this.setStorageAfterLogin(response);
    }

    async setCookiesAfterLogin(response: any) {
        // const csrftoken = await this.config.getCookie('csrftoken', true)
        const clientRunningOnServerHost = this.config.server_host === window.location.host;
        // // console.log('clientRunningOnServerHost', clientRunningOnServerHost)
        // if (!csrftoken || !clientRunningOnServerHost) { // meaning it's not served by django server
        //     const csrftoken_exp = response.csrftoken_exp
        //     const csrftoken = response.csrftoken
        //     const d = new Date(csrftoken_exp)
        //     this.config.setCookie('csrftoken', csrftoken, d, true).then(async () => {
        //         this.config.csrf_token = await this.config.getCookie('csrftoken', true);
        //     });
        // }
        const token = await this.config.getCookie('token', true)
        if (!token || !clientRunningOnServerHost) { // meaning it's not served by django server
            const csrftoken_exp = response.csrftoken_exp
            const token = response.token
            const d = new Date(csrftoken_exp)
            this.config.setCookie('token', token, d, true).then(async () => {
                this.config.token = await this.config.getCookie('token', true);
            });
        }

        const user = await this.config.getCookie('user', true)
        if (!user || !clientRunningOnServerHost) { // meaning it's not served by django server
            const csrftoken_exp = response.csrftoken_exp
            const user = response.user
            const d = new Date(csrftoken_exp)
            this.config.setCookie('user', JSON.stringify(user), d, true).then(async () => {
                const u = await this.config.getCookie('user', true)
                if (u) {
                    this.config.user = JSON.parse(u);
                }
            });
            // this.config.user = JSON.parse(this.config.getCookie('user'));
        }
    }

    async setStorageAfterLogin(response: any) {
        // const csrftoken = await this.config.getCookie('csrftoken', true)
        const clientRunningOnServerHost = this.config.server_host === window.location.host;
        // // console.log('clientRunningOnServerHost', clientRunningOnServerHost)
        // if (!csrftoken || !clientRunningOnServerHost) { // meaning it's not served by django server
        //     const csrftoken_exp = response.csrftoken_exp
        //     const csrftoken = response.csrftoken
        //     const d = new Date(csrftoken_exp)
        //     this.config.setCookie('csrftoken', csrftoken, d, true).then(async () => {
        //         this.config.csrf_token = await this.config.getCookie('csrftoken', true);
        //     });
        // }
        const token = await this.config.getStorage('token', true)
        console.log('token', token)
        if (!token || !clientRunningOnServerHost) { // meaning it's not served by django server
            const csrftoken_exp = response.csrftoken_exp
            const token = response.token
            const d = new Date(csrftoken_exp)
            this.config.setStorage('token', token, d, true).then(async () => {
                this.config.token = await this.config.getStorage('token', true);
            });
        }

        const user = await this.config.getStorage('user', true)
        if (!user || !clientRunningOnServerHost) { // meaning it's not served by django server
            const csrftoken_exp = response.csrftoken_exp
            const user = response.user
            const d = new Date(csrftoken_exp)
            this.config.setStorage('user', JSON.stringify(user), d, true).then(async () => {
                const u = await this.config.getStorage('user', true)
                if (u) {
                    this.config.user = JSON.parse(u);
                }
            });
            // this.config.user = JSON.parse(this.config.getCookie('user'));
        }
    }

}
