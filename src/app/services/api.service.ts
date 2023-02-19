import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Config} from "../config";
import {environment} from "@environment";
import {ChromeExtensionService} from "./chrome-extension.service";

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    serverBase = 'http://localhost:8000/';
    baseApi = 'api/';
    baseApiAuth = 'api/auth/';
    headers: any = {}
    constructor(
        private http: HttpClient,
        private chromeExtensionService: ChromeExtensionService,
        private config: Config
    ) {
        console.log('init api service')
        this.config.csrf_token_subject.subscribe((csrf_token) => {
            console.log('csrf_token', csrf_token)
            this.headers['X-CSRFToken'] = csrf_token;
        })
        this.config.token_subject.subscribe((token) => {
            delete this.headers['Authorization']
            if (token) {
                this.headers['Authorization'] = 'Token ' + token;
            }
        })
        this.config.token_subject.subscribe((token) => {
            // delete this.headers['Authorization']
            // if (!environment.production) {
            delete this.headers['X-CSRFToken']
            if (token) {
                this.headers['X-CSRFToken'] = token;
            }
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

    login(email: string, username: string, password: string) {
        return this.http.post(this.serverBase + this.baseApiAuth + 'login', {
                email: email,
                username: email,
                password: password
            },
            // {headers: this.headers}
        )
    }
    register(email: string, username: string, password: string) {
        return this.http.post(this.serverBase + this.baseApiAuth + 'register', {
                email: email,
                username: username,
                password: password
            },
            {headers: this.headers}
        )
    }

    forgotPassword(email: string) {
        return this.http.post(this.serverBase + this.baseApiAuth + 'forgot-pass', {
                email: email
            },
            {headers: this.headers}
        )
    }

    logout() {
        return this.http.post(this.serverBase + this.baseApiAuth + 'logout', {}, {headers: this.headers}
        )
    }

    promptOptimizer(prompt: string) {
        return this.http.post(this.serverBase + this.baseApi + 'prompt_optimizer', {
                prompt: prompt
            },
            {headers: this.headers}
        )
    }
    upload(formData: FormData) {
        return this.http.post(this.serverBase + this.baseApi + 'upload', formData,
            {headers: this.headers}
        )
    }

    analyze(filePath: string) {
        return this.http.post(this.serverBase + this.baseApi + 'analyze', {'file_path': filePath},
            {headers: this.headers}
        )
    }

    privacyModel(prompt: string, endPoint=null) {
        let url = this.serverBase + this.baseApi + 'privacy-model';
        if (endPoint) {
            url = endPoint;
        }
        return this.http.post(url, {'prompt': prompt},
            {headers: this.headers}
        )
    }

    collectUserPrompt(prompt: string) {
        return this.http.post(this.serverBase + this.baseApi + 'collect-user-prompt', {'prompt': prompt},
            {headers: this.headers}
        )
    }

    // setUpGaiaKeyForLocal() {
    //     if (environment.development) {
    //         this.headers['GAIA-AI-TOKEN'] = environment.gaia_company_token;
    //         this.config.is_company = true;
    //     }
    // }
}