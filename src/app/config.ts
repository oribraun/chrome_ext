import {Subject} from "rxjs";
import * as CryptoJS from 'crypto-js';
import { Storage } from "./storage";


const key = "My Secret Passphrase";

export class Config {
    private _version = '';
    private _user: any = '';
    private _server_host: string = '';
    private _server_host_subject: Subject<any> = new Subject<any>();
    private _server_url: string = '';
    private _server_url_subject: Subject<any> = new Subject<any>();
    private _is_company = false;
    private _is_company_subject: Subject<any> = new Subject<any>();
    private _token: string = '';
    private _csrf_token: string = '';
    private _user_subject: Subject<any> = new Subject<any>();
    private _token_subject: Subject<string> = new Subject<string>();
    private _csrf_token_subject: Subject<string> = new Subject<string>();

    private _force_binding_subject: Subject<any> = new Subject<any>();

    private _prompt_settings: any[];
    private _prompt_settings_subject: Subject<any> = new Subject<any>();

    get version(): string {
        return this._version;
    }

    set version(value: string) {
        this._version = value;
    }

    get user(): any {
        return this._user;
    }

    set user(value: any) {
        this._user = value;
        this._user_subject.next(this.user);
    }

    get server_host(): string {
        return this._server_host;
    }

    set server_host(value: string) {
        this._server_host = value;
        this._server_host_subject.next(this.server_host);
    }

    get server_host_subject(): Subject<any> {
        return this._server_host_subject;
    }

    set server_host_subject(value: Subject<any>) {
        this._server_host_subject = value;
    }

    get server_url(): string {
        return this._server_url;
    }

    set server_url(value: string) {
        this._server_url = value;
        this._server_url_subject.next(this.server_url);
    }

    get server_url_subject(): Subject<any> {
        return this._server_url_subject;
    }

    set server_url_subject(value: Subject<any>) {
        this._server_url_subject = value;
    }

    get is_company(): boolean {
        return this._is_company;
    }

    set is_company(value: boolean) {
        this._is_company = value;
        this._is_company_subject.next(this.is_company)
    }

    get is_company_subject(): Subject<any> {
        return this._is_company_subject;
    }

    set is_company_subject(value: Subject<any>) {
        this._is_company_subject = value;
    }

    get token(): string {
        return this._token;
    }

    set token(value: string) {
        this._token = value;
        this._token_subject.next(this.token);
    }

    get csrf_token(): string {
        return this._csrf_token;
    }

    set csrf_token(value: string) {
        this._csrf_token = value;
        this._csrf_token_subject.next(this.csrf_token)
    }

    get user_subject(): Subject<any> {
        return this._user_subject;
    }

    set user_subject(value: Subject<any>) {
        this._user_subject = value;
    }

    get token_subject(): Subject<any> {
        return this._token_subject;
    }

    set token_subject(value: Subject<any>) {
        this._token_subject = value;
    }

    get csrf_token_subject(): Subject<any> {
        return this._csrf_token_subject;
    }

    set csrf_token_subject(value: Subject<any>) {
        this._csrf_token_subject = value;
    }

    get force_binding_subject(): Subject<any> {
        return this._force_binding_subject;
    }

    set force_binding_subject(value: Subject<any>) {
        this._force_binding_subject = value;
    }

    get prompt_settings(): any[] {
        return this._prompt_settings;
    }

    set prompt_settings(value: any[]) {
        this._prompt_settings = value;
        this.prompt_settings_subject.next(this._prompt_settings);
    }

    get prompt_settings_subject(): Subject<any> {
        return this._prompt_settings_subject;
    }

    set prompt_settings_subject(value: Subject<any>) {
        this._prompt_settings_subject = value;
    }

    resetUserCreds() {
        this.user = '';
        this.token = '';
        this.csrf_token = '';
    }

    getCookie(name: string, decrypt=false): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!chrome.cookies) {
                const value = `; ${document.cookie}`;
                const parts: any = value.split(`; ${name}=`);
                if (parts && parts.length === 2) {
                    let val = parts.pop().split(';').shift();
                    if (decrypt) {
                        try {
                            val = this.Decrypt(val, key);
                        } catch (err) {
                            val = '';
                        }
                    }
                    resolve(val);
                } else {
                    resolve('');
                }
            } else {
                let url = '';
                if (window.location.ancestorOrigins && window.location.ancestorOrigins.length) {
                    url = window.location.ancestorOrigins[0];
                }
                console.log('cookies url', url)
                chrome.cookies.get({
                    url: url,
                    name: name
                }, (cookie) => {
                    if(cookie) {
                        let val = cookie.value;
                        if (decrypt) {
                            try {
                                val = this.Decrypt(val, key);
                            } catch (err) {
                                val = '';
                            }
                        }
                        resolve(val)
                    } else {
                        resolve('')
                    }
                    // console.log('get cookie from extension', cookie)
                })
                // chrome.cookies.get({
                //     url: 'https://chat.openai.com',
                //     name: 'csrftoken'
                // }, (cookie) => {
                //     console.log('cookie', cookie)
                // })
            }
        });
    }

    setCookie(name: string, val: string, exp: Date, encrypt=false) {
        let final_val = val;
        if (encrypt && val) {
            try {
                final_val = this.Encrypt(val, key).toString()
            } catch (err) {
                final_val = val;
            }
        }
        return new Promise((resolve, reject) => {
            if (!chrome.cookies) {
                var c_value = final_val + "; expires=" + exp.toUTCString();
                document.cookie = name + "=" + c_value;
                resolve(1)
            } else {
                let url = '';
                if (window.location.ancestorOrigins && window.location.ancestorOrigins.length) {
                    url = window.location.ancestorOrigins[0];
                }
                chrome.cookies.set({
                    url: url,
                    name: name,
                    value: final_val,
                    expirationDate: exp.getTime()/1000
                }, (cookie) => {
                    resolve(cookie);
                    // console.log('set cookie from extension', cookie)
                });

            }
        })
    }

    Encrypt(word: string, key = 'share') {
        let encJson = CryptoJS.AES.encrypt(JSON.stringify(word), key).toString()
        let encData = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encJson))
        return encData
    }

    Decrypt(word: string, key = 'share') {
        let decData = CryptoJS.enc.Base64.parse(word).toString(CryptoJS.enc.Utf8)
        let bytes = CryptoJS.AES.decrypt(decData, key).toString(CryptoJS.enc.Utf8)
        return JSON.parse(bytes)
    }

    resetCookies() {
        const exp = new Date()
        exp.setDate(exp.getDate()-5);
        this.setCookie('user', '', exp);
        this.setCookie('token', '', exp);
        this.setCookie('csrftoken', '', exp);
    }

    getStorage(name: string, decrypt=false): Promise<string> {
        return new Promise((resolve, reject) => {
            return Storage.get(name).then((res: any) => {
                let results = res[name]
                if (decrypt && results) {
                    results = this.Decrypt(results, key)
                }
                resolve(results);
            }).catch(() => {
                resolve('');
            })
        })
    }

    setStorage(name: string, val: string, exp: Date, encrypt=false) {
        return new Promise((resolve, reject) => {
            if (encrypt) {
                val = this.Encrypt(val, key)
            }
            return Storage.set(name, val).then(() => {
                resolve(1);
            }).catch(() => {
                resolve(0);
            })
        })
    }

    removeStorage(name: string) {
        return new Promise((resolve, reject) => {
            return Storage.remove(name).then(() => {
                resolve(1);
            }).catch(() => {
                resolve(0);
            })
        })
    }


    resetStorage() {
        this.removeStorage('user');
        this.removeStorage('token');
        this.removeStorage('csrftoken');
    }

    hostToName() {
        const map: any = {
            'chat.openai.com': 'ChatGpt',
        }
        let name = '';
        console.log('this.server_host', this.server_host)
        if (map[this.server_host]) {
            name = map[this.server_host];
        }
        return name;
    }
}
