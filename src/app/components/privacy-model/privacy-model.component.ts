import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ApiService} from "../../services/api.service";
import {Config} from "../../config";
import {lastValueFrom} from "rxjs";
import {ChromeExtensionService} from "../../services/chrome-extension.service";
import {Router} from "@angular/router";

@Component({
    selector: 'app-privacy-model',
    templateUrl: './privacy-model.component.html',
    styleUrls: ['./privacy-model.component.less']
})
export class PrivacyModelComponent implements OnInit, OnDestroy {
    // chromeListener: any
    modelResults: any
    endPoint: any
    host: any
    user: any;
    resultsModelTest: any;
    listener: any;
    constructor(
        private apiService: ApiService,
        private chromeExtensionService: ChromeExtensionService,
        private config: Config,
        private router:Router,
        private ref:ChangeDetectorRef
    ) {
        // this.chromeListener = async (request: any, sender: any, sendResponse: any) => {
        //     console.log('git from content script request for privacy model')
        //     if (request.type && request.type === "privacy-model") {
        //         this.resetModelResults();
        //         const prompt = request.prompt;
        //         this.apiService.privacyModel(prompt).subscribe(async (res) => {
        //             this.modelResults = res;
        //             this.forceBindChanges();
        //             console.log('this.modelResults', this.modelResults)
        //             if (this.modelResults.pass_privacy) {
        //                 this.sendResToContentScript(res);
        //             } else {
        //                 const [tab]: any = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        //                 console.log('tab', tab)
        //                 // chrome.tabs.sendMessage(tab.id, {type: 'toggle-sidebar'}, (response) => {
        //                 //     console.log('toggle-sidebar got the message', response)
        //                 // });
        //             }
        //             // const [tab]: any = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        //             // const response = await chrome.tabs.sendMessage(tab.id, {type: 'privacy-model-response', response: res});
        //             // console.log('content script got the message', response)
        //         })
        //     }
        //     sendResponse({success: true});
        // };
        // this.setMockData();
    }

    setMockData() {
        this.modelResults = {
            "err": 0,
            "errMessage": "",
            "model_res": [
                {
                    "text": "chrome extension popup",
                    "pred": "Negative",
                    "prob": 0.9730705618858337
                }
            ],
            "suggested_prompt": "chrome extension popup suggested",
            "suggested_model": " Privacy model V1",
            "pass_privacy": false
        }
    }

    ngOnInit(): void {
        console.log('init privacy model component')
        this.endPoint = this.apiService.serverBase + this.apiService.baseApi + 'privacy-model';
        // console.log('init privacy model')
        this.config.server_host_subject.subscribe(() => {
            this.host = this.config.hostToName();
            this.forceBindChanges();
        })
        this.config.user_subject.subscribe(() => {
            // this.promptOptimizer();
        })
        this.listenToChromeContentScriptMessages();
    }

    resetModelResults() {
        this.modelResults = null;
        this.forceBindChanges();
    }

    forceBindChanges() {
        if (chrome.runtime) {
            this.ref.detectChanges();
        }
    }

    async sendResToContentScript(res: any) {
        console.log('sending privacy model results to content script')
        const [tab]: any = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        const response = await chrome.tabs.sendMessage(tab.id, {type: 'privacy-model-response', response: res});
        console.log('content script got the message', response)
    }

    listenToChromeContentScriptMessages() {
        this.listener = this.chromeExtensionService.ListenFor("privacy-model").subscribe((obj) => {
            console.log('this.router.url',this.router.url)
            const request = obj.request;
            const sender = obj.sender;
            const sendResponse = obj.sendResponse;
            this.resetModelResults();
            const prompt = request.prompt;
            this.apiService.privacyModel(prompt, this.endPoint).subscribe(async (res) => {
                this.modelResults = res;
                this.forceBindChanges();
                console.log('this.modelResults', this.modelResults)
                if (this.modelResults.pass_privacy) {
                    this.chromeExtensionService.sendMessageToContentScript('privacy-model-response', res)
                } else {
                    this.chromeExtensionService.showSidebar('privacyModel');
                    // const [tab]: any = await chrome.tabs.query({active: true, lastFocusedWindow: true});
                    // console.log('tab', tab)
                    // chrome.tabs.sendMessage(tab.id, {type: 'toggle-sidebar'}, (response) => {
                    //     console.log('toggle-sidebar got the message', response)
                    // });
                }
                // const [tab]: any = await chrome.tabs.query({active: true, lastFocusedWindow: true});
                // const response = await chrome.tabs.sendMessage(tab.id, {type: 'privacy-model-response', response: res});
                // console.log('content script got the message', response)
            }, (err) => {
                if (err.status === 403) {
                    // Forbidden - not exist
                }
                if (err.status === 401) {
                    // Unauthorized
                    this.config.resetCookies();
                    this.config.resetUserCreds();
                    this.chromeExtensionService.sendMessageToContentScript('login-required', {})
                    this.chromeExtensionService.showSidebar('privacyModel 401');
                    this.router.navigate(['/login']);
                }
                console.log('err', err)
            })
            sendResponse({success: true});
        })
        // this.chromeExtensionService.listenToMessages.subscribe((obj) => {
        //     console.log('this.router.url',this.router.url)
        //     const request = obj.request;
        //     const sender = obj.sender;
        //     const sendResponse = obj.sendResponse;
        //     if (request.type && request.type === "privacy-model") {
        //         this.resetModelResults();
        //         const prompt = request.prompt;
        //         this.apiService.privacyModel(prompt, this.endPoint).subscribe(async (res) => {
        //             this.modelResults = res;
        //             this.forceBindChanges();
        //             console.log('this.modelResults', this.modelResults)
        //             if (this.modelResults.pass_privacy) {
        //                 this.chromeExtensionService.sendMessageToContentScript('privacy-model-response', res)
        //             } else {
        //                 this.chromeExtensionService.showSidebar();
        //                 // const [tab]: any = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        //                 // console.log('tab', tab)
        //                 // chrome.tabs.sendMessage(tab.id, {type: 'toggle-sidebar'}, (response) => {
        //                 //     console.log('toggle-sidebar got the message', response)
        //                 // });
        //             }
        //             // const [tab]: any = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        //             // const response = await chrome.tabs.sendMessage(tab.id, {type: 'privacy-model-response', response: res});
        //             // console.log('content script got the message', response)
        //         }, (err) => {
        //             if (err.status === 403) {
        //                 // Forbidden - not exist
        //             }
        //             if (err.status === 401) {
        //                 // Unauthorized
        //                 this.config.resetCookies();
        //                 this.config.resetUserCreds();
        //                 this.chromeExtensionService.sendMessageToContentScript('login-required', {})
        //                 this.chromeExtensionService.showSidebar();
        //                 this.router.navigate(['/login']);
        //             }
        //             console.log('err', err)
        //         })
        //     }
        //     sendResponse({success: true});
        // })
    }

    promptOptimizer() {
        this.apiService.promptOptimizer('test').subscribe((res) => {
            console.log('res', res)
        })
    }

    listenToChromeExtMessages() {
        // if (chrome.runtime) {
        //     console.log('listenToChromeExtMessages')
        //     chrome.runtime.onMessage.addListener(this.chromeListener)
        // }
    }

    async copyPrompt() {
        if (chrome.tabs) {
            const [tab]: any = await chrome.tabs.query({active: true, lastFocusedWindow: true});
            const response = await chrome.tabs.sendMessage(tab.id, {type: 'copy-prompt', response: {prompt: this.modelResults.suggested_prompt}});
            console.log('content script got the message', response)
            this.chromeExtensionService.showSidebar('copyPrompt');
        }
    }

    async forcePrompt() {
        if (chrome.tabs) {
            const [tab]: any = await chrome.tabs.query({active: true, lastFocusedWindow: true});
            const response = await chrome.tabs.sendMessage(tab.id, {type: 'force-prompt'});
            console.log('content script got the message', response)
            this.resetModelResults();
        }
    }

    testPrivacyModelApi() {
        this.apiService.privacyModel('test', this.endPoint).subscribe(async (res) => {
            this.resultsModelTest = true;
            console.log('res', res)
        }, (err) => {
            this.resultsModelTest = false;
            if (err) {
                if (err.status === 403) {
                    // Forbidden - not exist
                }
                if (err.status === 401) {
                    // Unauthorized
                    console.log('Unauthorized')
                    this.config.resetCookies();
                    this.config.resetUserCreds();
                    this.chromeExtensionService.sendMessageToContentScript('login-required', {})
                    this.chromeExtensionService.showSidebar('testPrivacyModelApi');
                    this.router.navigate(['/login']);
                }
            }
            console.log('err', err)
        })
    }

    async logout(e: Event) {
        e.preventDefault();
        const response = await this.apiService.logout().toPromise();
        this.config.resetCookies();
        this.config.resetUserCreds();
        this.router.navigate(['/login'])
    }

    ngOnDestroy(): void {
        if (chrome.runtime) {
            //     console.log('removing listenToChromeExtMessages')
            //     chrome.runtime.onMessage.removeListener(this.chromeListener);
        }
        // this.chromeExtensionService.ClearEvent("privacy-model");
        this.listener.unsubscribe();
    }



}
