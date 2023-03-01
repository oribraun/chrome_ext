import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Config} from "../config";
import {environment} from "@environment";
import {ChromeExtensionService} from "./chrome-extension.service";

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    // serverBase = 'http://localhost:8000/';
    // serverBase = 'http://ip.gaialabs.ai/';
    // serverBase = 'http://13.230.184.34/';
    // serverBase = 'http://13.112.220.195:8000/';
    serverBase = environment.serverUrl;
    baseApi = 'api/';
    baseApiAuth = 'api/auth/';
    headers: any = {}
    private httpOptionsWithCreds = {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        // headers: new HttpHeaders(),
        withCredentials: true // Whether this request should be sent with outgoing credentials
    };
    private httpOptionsWithoutCreds = {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        // headers: new HttpHeaders(),
        withCredentials: false // Whether this request should be sent with outgoing credentials
    };
    private httpOptions: any = {
        // headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        headers: {},
        withCredentials: true // Whether this request should be sent with outgoing credentials
    };
    constructor(
        private http: HttpClient,
        private chromeExtensionService: ChromeExtensionService,
        private config: Config
    ) {
        console.log('init api service')
        this.config.csrf_token_subject.subscribe((csrf_token) => {
            // console.log('csrf_token', csrf_token)
            // if (csrf_token) {
            //     this.httpOptions.headers['X-CSRFToken'] = csrf_token;
            // } else {
            //     delete this.httpOptions.headers['X-CSRFToken'];
            // }
        })
        this.config.token_subject.subscribe((token) => {
            this.httpOptionsWithCreds.headers.delete('Authorization');
            this.httpOptionsWithoutCreds.headers.delete('Authorization');
            delete this.httpOptions.headers['Authorization'];
            if (token) {
                this.httpOptionsWithCreds.headers.set('Authorization', 'Token ' + token)
                this.httpOptionsWithoutCreds.headers.set('Authorization', 'Token ' + token)
                this.httpOptions.headers['Authorization'] = 'Token ' + token;
            }
        })
        this.config.token_subject.subscribe((token) => {
            // console.log('asdfasf', token)
            // delete this.headers['Authorization']
            // if (!environment.production) {
            // delete this.headers['X-CSRFToken']
            // if (token) {
            //     this.headers['X-CSRFToken'] = token;
            // }
            // if (token) {
            //     this.headers['Authorization'] = 'Token ' + token;
            // }
            // }
        })

        // this.chromeExtensionService.getCompanyApiKey().then((api_key) => {
        //     this.headers['GAIA-AI-TOKEN'] = api_key;
        //     this.config.is_company = true;
        // }).catch((err) => {
        //     console.log('no api key')
        // })
        // this.setUpGaiaKeyForLocal();
    }

    login(email: string, password: string) {
        return this.http.post(this.serverBase + this.baseApiAuth + 'login', {
                email: email,
                password: password
            },
            this.httpOptions
            // {headers: this.headers}
        )
    }
    register(email: string, username: string, password: string) {
        return this.http.post(this.serverBase + this.baseApiAuth + 'register', {
                email: email,
                username: username,
                password: password
            },
            this.httpOptions
            // {headers: this.headers}
        )
    }

    forgotPassword(email: string) {
        return this.http.post(this.serverBase + this.baseApiAuth + 'forgot-pass', {
                email: email
            },
            this.httpOptions
        )
    }

    logout() {
        return this.http.post(this.serverBase + this.baseApiAuth + 'logout', {},
            this.httpOptions
        )
    }

    promptOptimizer(prompt: string) {
        return this.http.post(this.serverBase + this.baseApi + 'prompt_optimizer', {
                prompt: prompt
            },
            this.httpOptions
        )
    }
    upload(formData: FormData) {
        return this.http.post(this.serverBase + this.baseApi + 'upload', formData,
            this.httpOptions
        )
    }

    analyze(filePath: string) {
        return this.http.post(this.serverBase + this.baseApi + 'analyze', {'file_path': filePath},
            this.httpOptions
        )
    }

    privacyModel(prompt: string, endPoint=null) {
        let url = this.serverBase + this.baseApi + 'privacy-model';
        if (endPoint) {
            url = endPoint;
        }
        return this.http.post(url, {'prompt': prompt},
            this.httpOptions
        )
    }

    collectUserPrompt(prompt: string) {
        return this.http.post(this.serverBase + this.baseApi + 'collect-user-prompt', {'prompt': prompt},
            this.httpOptions
        )
    }

    getAnswer(prompt: string) {
        return this.http.post(this.serverBase + this.baseApi + 'get-answer', {'prompt': prompt},
            this.httpOptions
        )
    }
    getAnswerStreaming(prompt: string) {
        this.httpOptions['responseType'] = 'text';
        this.httpOptions['observe'] = 'events';
        this.httpOptions['reportProgress'] = true;
        return this.http.post(this.serverBase + this.baseApi + 'get-answer', {'prompt': prompt},
            this.httpOptions
        )
    }
    getGoogleToken(token: string) {
        return this.http.post(this.serverBase + this.baseApi + 'google/get-token', {'token': token},
            this.httpOptions
        )
    }
    verifyGoogleToken(prompt: string) {
        return this.http.post(this.serverBase + this.baseApi + 'google/verify-token', {'prompt': prompt},
            this.httpOptions
        )
    }
    public(prompt: string) {
        return this.http.post(this.serverBase + this.baseApi + 'public', {'prompt': prompt},
            this.httpOptions
        )
    }

    // setUpGaiaKeyForLocal() {
    //     if (environment.development) {
    //         this.headers['GAIA-AI-TOKEN'] = environment.gaia_company_token;
    //         this.config.is_company = true;
    //     }
    // }
}
