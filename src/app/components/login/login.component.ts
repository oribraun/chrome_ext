import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Config} from "../../config";
import {ApiService} from "../../services/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {lastValueFrom} from "rxjs";
import {ChromeExtensionService} from "../../services/chrome-extension.service";
import {MyRouter} from "../my.router";

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
    errMessage = '';
    successMessage = '';
    showVerify = false;

    constructor(
        private http: HttpClient,
        private config: Config,
        private apiService: ApiService,
        private chromeExtensionService: ChromeExtensionService,
        private router: MyRouter,
        private route: ActivatedRoute,
        private ref: ChangeDetectorRef
    ) {
    }

    ngOnInit(): void {
        this.config.user_subject.subscribe((user) => {
            this.checkUser();
        })
        this.checkUser(false);
        this.route.paramMap.subscribe((paramMap) => {
            const type = paramMap.get('type')
            if (type && this.formTypeOptions.indexOf(type) > -1) {
                this.formType = type;
            }
        })
        // this.listenToChromeContentScriptMessages();
    }

    checkUser(showSidebar: boolean = true) {
        if (!this.config.user) {
            if (showSidebar) {
                this.chromeExtensionService.showSidebar('checkUser');
            }
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
        this.resetMessages();
        try {
            const response: any = await lastValueFrom(this.apiService.login(this.email,this.password));
            const data = response.data;
            if (!response.err) {
                this.setupUser(data);
                // this.chromeExtensionService.hideSidebar();
                this.router.navigate([''])
            } else {
                this.errMessage = response.errMessage;
                if (data.verify) {
                    this.showVerify = true;
                }
            }
            this.forceBindChanges();
        } catch (error) {
            console.error(error);
        }
    }

    async register() {
        this.resetMessages();
        try {
            const response: any = await this.apiService.register(this.email, this.username, this.password).toPromise();
            if (!response.err) {
                const data = response.data;
                const success_message = data.message;
                this.successMessage = success_message;
                // this.setupUser(data);
                // this.chromeExtensionService.hideSidebar();
                // this.router.navigate(['/'])
            } else {
                if (Array.isArray(response.errMessage)) {
                    this.errMessage = response.errMessage.join('</br>');
                } else {
                    this.errMessage = response.errMessage;
                }
            }
            this.forceBindChanges();
        } catch (error) {
            console.error(error);
        }
    }

    async forgot() {
        this.resetMessages();
        try {
            const response: any = await lastValueFrom(this.apiService.forgotPassword(this.email));
            if (!response.err) {
                // console.log('email sent successfully, please check your email')
                this.successMessage = 'email sent successfully, please check your email';
            } else {
                this.errMessage = response.errMessage;
            }
            this.forceBindChanges();
        } catch (error) {
            console.error(error);
        }
    }

    async resendVerifyEmail(event: Event) {
        event.preventDefault();
        this.resetMessages();
        try {
            const response: any = await lastValueFrom(this.apiService.resendVerifyEmail(this.email));
            if (!response.err) {
                // console.log('email sent successfully, please check your email')
                this.successMessage = 'email sent successfully, please check your email';
            } else {
                this.errMessage = response.errMessage;
            }
            this.showVerify = false;
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
        const clientRunningOnServerHost = this.config.server_host === window.location.origin + '/';
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
        const clientRunningOnServerHost = this.config.server_host === window.location.host + '/';
        console.log('clientRunningOnServerHost', clientRunningOnServerHost)
        // if (!csrftoken || !clientRunningOnServerHost) { // meaning it's not served by django server
        //     const csrftoken_exp = response.csrftoken_exp
        //     const csrftoken = response.csrftoken
        //     const d = new Date(csrftoken_exp)
        //     this.config.setCookie('csrftoken', csrftoken, d, true).then(async () => {
        //         this.config.csrf_token = await this.config.getCookie('csrftoken', true);
        //     });
        // }
        const csrftoken = await this.config.getCookie('csrftoken')
        if (!csrftoken || !clientRunningOnServerHost) { // meaning it's not served by django server
            const csrftoken_exp = response.csrftoken_exp
            const csrftoken = response.csrftoken
            const d = new Date(csrftoken_exp)
            this.config.setCookie('csrftoken', csrftoken, d).then(async () => {
                this.config.csrf_token = await this.config.getCookie('csrftoken');
            });
        }
        const token = await this.config.getStorage('token', true)
        // console.log('token', token)
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

    forceBindChanges() {
        if (chrome.runtime) {
            this.ref.detectChanges();
        }
    }

    resetMessages() {
        this.errMessage = '';
        this.successMessage = '';
        this.showVerify = false;
    }

    // signInWithGoogle(): void {
    //     this.authService.signIn(GoogleLoginProvider.PROVIDER_ID);
    // }
    //
    // signOut(): void {
    //     this.authService.signOut();
    // }
    //
    // subscribeAuth() {
    //     this.authService.authState.subscribe((socialUser) => {
    //         const idToken = socialUser.idToken;
    //         const id = socialUser.id;
    //         const name = socialUser.name;
    //         const email = socialUser.email;
    //         const photoUrl = socialUser.photoUrl;
    //         const firstName = socialUser.firstName;
    //         const lastName = socialUser.lastName;
    //         const provider = socialUser.provider; // GOOGLE
    //         console.log('socialUser', socialUser)
    //
    //     });
    // }

}
