import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {ApiService} from "../../services/api.service";
import {ChromeExtensionService} from "../../services/chrome-extension.service";
import {Config} from "../../config";

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit, OnDestroy {
    allowUserPages = ['prompt-uploader', 'chat']
    allowCompanyPages = ['privacy-model']
    page = 'privacy-model'

    // privacy model config
    modelResults: any
    chat: any = [
        // {text: 'hi there'},
        // {text: ''}
    ]
    chatLimit = 50;
    sentQuestion = true;
    endPoint: any
    host: any
    user: any;
    resultsModelTest: any;
    privacyModelListener: any;
    getAnswerListener: any;

    //prompt upload config
    fileText = ''
    fileName = ''
    fileUploadErr = ''

    constructor(
        private apiService: ApiService,
        private chromeExtensionService: ChromeExtensionService,
        private config: Config,
        private router:Router,
        private ref:ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        console.log('init main component')
        this.setUpInitPage();
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
        this.chromeExtensionService.ListenFor('page-change').subscribe((res: any) => {
            let array = this.allowUserPages;
            if (this.config.is_company) {
                array = array.concat(this.allowCompanyPages);
            }
            if (array.indexOf(res.page) > -1) {
                this.page = res.page;
            }

        });
        // this.setPrivacyModelMockData();
    }

    setUpInitPage() {
        console.log('this.config.is_company', this.config.is_company)
        if (this.config.is_company) {
            this.page = 'privacy-model';
        } else {
            this.page = 'prompt-uploader';
        }
    }

    changePage(page: string) {
        this.page = page;
    }

    listenToChromeContentScriptMessages() {
        this.privacyModelListener = this.chromeExtensionService.ListenFor("privacy-model").subscribe((obj) => {
            // console.log('this.router.url',this.router.url)
            this.page = 'privacy-model';
            const request = obj.request;
            const sender = obj.sender;
            const sendResponse = obj.sendResponse;
            const prompt = request.prompt;
            if (!this.config.is_company) {
                sendResponse({success: false, message: 'unauthorized'});
                this.apiService.collectUserPrompt(prompt).subscribe();
                this.forcePrompt();
                 return;
             }
            this.resetModelResults();
            this.apiService.privacyModel(prompt, this.endPoint).subscribe(async (res) => {
                this.modelResults = res;
                this.forceBindChanges();
                // console.log('this.modelResults', this.modelResults)
                if (this.modelResults.pass_privacy) {
                    this.chromeExtensionService.sendMessageToContentScript('privacy-model-response', res)
                } else {
                    this.chromeExtensionService.showSidebar('privacyModel');
                }
            }, (err) => {
                if (err.status === 403) {
                    // Forbidden - not exist
                }
                if (err.status === 401) {
                    // Unauthorized
                    // this.config.resetCookies();
                    // this.config.resetUserCreds();
                    // this.chromeExtensionService.sendMessageToContentScript('login-required', {})
                    // this.chromeExtensionService.showSidebar();
                    // this.router.navigate(['/login']);
                }
                console.log('err', err)
            })
            sendResponse({success: true});
        })
        this.getAnswerListener = this.chromeExtensionService.ListenFor("chat").subscribe((obj) => {
            // console.log('this.router.url',this.router.url)
            this.page = 'chat';
            const request = obj.request;
            const sender = obj.sender;
            const sendResponse = obj.sendResponse;
            const text = request.text;
            if (!this.config.is_company) {
                sendResponse({success: false, message: 'unauthorized'});
                 return;
             }
            // this.resetModelResults();
            this.chat.push({text:text})
            this.chat.push({text:''})
            this.sentQuestion = true;
            this.forceBindChanges();
            this.scrollToBottom();

            this.chromeExtensionService.showSidebar('getAnswerListener');

            this.apiService.getAnswer(text).subscribe(async (res: any) => {
                this.sentQuestion = false;
                if (res && res.data) {
                    this.limitAnswers()
                    this.chat[this.chat.length - 1].text = res.data.answer;
                    this.chromeExtensionService.showSidebar('getAnswerListener 2');
                    this.scrollToBottom();
                }
                this.forceBindChanges();
            }, (err) => {
                if (err.status === 403) {
                    // Forbidden - not exist
                }
                if (err.status === 401) {
                    // Unauthorized
                    // this.config.resetCookies();
                    // this.config.resetUserCreds();
                    // this.chromeExtensionService.sendMessageToContentScript('login-required', {})
                    // this.chromeExtensionService.showSidebar();
                    // this.router.navigate(['/login']);
                }
                console.log('err', err)
            })
            sendResponse({success: true});
        })
    }

    testPrivacyModelApi() {
        this.apiService.privacyModel('test', this.endPoint).subscribe(async (res) => {
            this.resultsModelTest = true;
            this.forceBindChanges();
            console.log('res', res)
        }, (err) => {
            this.resultsModelTest = false;
            this.forceBindChanges();
            if (err) {
                if (err.status === 403) {
                    // Forbidden - not exist
                }
                if (err.status === 401) {
                    // Unauthorized
                    // console.log('Unauthorized')
                    // this.config.resetCookies();
                    // this.config.resetUserCreds();
                    // this.chromeExtensionService.sendMessageToContentScript('login-required', {})
                    // this.chromeExtensionService.showSidebar();
                    // this.router.navigate(['/login']);
                }
            }
            console.log('err', err)
        })
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

    resetModelResults() {
        this.modelResults = null;
        this.forceBindChanges();
    }

    forceBindChanges() {
        if (chrome.runtime) {
            this.ref.detectChanges();
        }
    }

    limitAnswers() {
        if (this.chat.length > this.chatLimit) {
            this.chat.shift();
        }
    }

    scrollToBottom() {
        window.scrollTo(0, document.body.scrollHeight);
    }


    setPrivacyModelMockData() {
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



    fileChanged(e: any) {
        this.fileUploadErr = '';
        if (e.target.files && e.target.files.length) {
            this.fileText = ''
            this.fileName = ''
            const file = e.target.files[0];
            this.fileName = file.name;
            console.log('type', file.name);
            if (file.type === 'text/plain') {
                this.readFile(e, file)
            } else {
                this.fileUploadErr = 'please upload txt file only';
            }
        }
    }
    readFile(event: any,file: File) {
        let fileReader = new FileReader();
        fileReader.onload = (e) => {
            console.log('fileReader.result', fileReader.result)
            console.log(fileReader.result);
            if (fileReader.result) {
                this.fileText = fileReader.result.toString();
                if (event.target) {
                    event.target.value = '';
                }
            }

        }
        fileReader.readAsText(file);
    }

    copyTextToPrompt() {
        if (chrome.tabs) {
            this.chromeExtensionService.sendMessageToContentScript('copy-prompt', {prompt: this.fileText})
        }
    }

    ngOnDestroy(): void {
        this.privacyModelListener.unsubscribe();
    }



}
