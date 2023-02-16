import {Subject} from "rxjs";

export class Config {
    private _user: any = '';
    private _server_host: string = '';
    private _server_host_subject: Subject<any> = new Subject<any>();
    private _token: string = '';
    private _csrf_token: string = '';
    private _user_subject: Subject<any> = new Subject<any>();
    private _token_subject: Subject<string> = new Subject<string>();
    private _csrf_token_subject: Subject<string> = new Subject<string>();

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

    resetUserCreds() {
        this.user = '';
        this.token = '';
        this.csrf_token = '';
    }

    getCookie(name: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!chrome.cookies) {
                const value = `; ${document.cookie}`;
                const parts: any = value.split(`; ${name}=`);
                if (parts && parts.length === 2) {
                    resolve(parts.pop().split(';').shift());
                } else {
                    resolve('');
                }
            } else {
                chrome.cookies.get({
                    url: 'https://chat.openai.com',
                    name: name
                }, (cookie) => {
                    if(cookie) {
                        resolve(cookie.value)
                    } else {
                        resolve('')
                    }
                    // console.log('get cookie from extension', cookie)
                })
            }
        });
    }

    setCookie(name: string, val: string, exp: Date) {
        return new Promise((resolve, reject) => {
            if (!chrome.cookies) {
                var c_value = val + "; expires=" + exp.toUTCString();
                document.cookie = name + "=" + c_value;
                resolve(1)
            } else {
                chrome.cookies.set({
                    url: 'https://chat.openai.com',
                    name: name,
                    value: val,
                    expirationDate: exp.getTime()
                }, (cookie) => {
                    resolve(cookie);
                    // console.log('set cookie from extension', cookie)
                });

            }
        })
    }

    resetCookies() {
        const exp = new Date()
        exp.setDate(exp.getDate()-5);
        this.setCookie('user', '', exp);
        this.setCookie('token', '', exp);
        this.setCookie('csrftoken', '', exp);
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
