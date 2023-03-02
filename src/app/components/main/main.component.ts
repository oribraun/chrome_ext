import {ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {ApiService} from "../../services/api.service";
import {ChromeExtensionService} from "../../services/chrome-extension.service";
import {Config} from "../../config";
import {MyRouter} from "../my.router";
import {HttpEventType} from "@angular/common/http";
import {Observable} from "rxjs";

declare var $: any;
@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit, OnDestroy {
    @ViewChild('chat_results_scroll') chatResultsScroll: ElementRef;
    allowUserPages = ['prompt-uploader', 'chat', 'settings']
    allowCompanyPages = ['privacy-model']
    page = 'privacy-model'

    // privacy model config
    modelResults: any
    chat: any = [
        // {text: 'hi there'},
        // {text: ''},
    ]
    chatLimit = 50;
    sentQuestion = true;
    endPoint: any
    host: any
    user: any;
    resultsModelTest: any;
    privacyModelListener: any;
    getAnswerListener: any;
    chatRequestInProgress = false;
    chatPrompt = '';

    //prompt upload config
    fileText = ''
    fileName = ''
    fileUploadErr = ''

    chatGptNeedToRefreshToken = false;
    chatGptCurrentMessage = '';

    scrollInProgress = false;

    constructor(
        private apiService: ApiService,
        private chromeExtensionService: ChromeExtensionService,
        private config: Config,
        private router:MyRouter,
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
                if (this.page === 'chat') {
                    setTimeout(() => {
                        this.scrollToBottom();
                    })
                }
            }

        });

        // this.trySendingMessageToPort()
        this.ListenToChatGpt()
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
            if (this.chatRequestInProgress) {
                return;
            }
            this.chatRequestInProgress = true;
            this.page = 'chat';
            const request = obj.request;
            const sender = obj.sender;
            const sendResponse = obj.sendResponse;
            const text = request.text;
            if (request.noGptToken) {
                this.chatGptNeedToRefreshToken = true;
                this.chatRequestInProgress = false;
                this.chromeExtensionService.showSidebar('ListenFor chat');
                this.forceBindChanges();
                return;
            }
            this.chatGptNeedToRefreshToken = false;
            if (!this.config.is_company) {
                sendResponse({success: false, message: 'Unauthorized'});
                return;
            }
            // this.resetModelResults();
            this.chatProcessPrompt(text)
            // this.apiService.getAnswer(text).subscribe(async (res: any) => {
            //     this.sentQuestion = false;
            //     if (res && res.data) {
            //         this.limitAnswers()
            //         this.chat[this.chat.length - 1].text = res.data.answer;
            //         this.chromeExtensionService.showSidebar('getAnswerListener 2');
            //         this.scrollToBottom();
            //     }
            //     this.forceBindChanges();
            // }, (err) => {
            //     if (err.status === 403) {
            //         // Forbidden - not exist
            //     }
            //     if (err.status === 401) {
            //         // Unauthorized
            //         // this.config.resetCookies();
            //         // this.config.resetUserCreds();
            //         // this.chromeExtensionService.sendMessageToContentScript('login-required', {})
            //         // this.chromeExtensionService.showSidebar();
            //         // this.router.navigate(['/login']);
            //     }
            //     console.log('err', err)
            // })
            sendResponse({success: true});
        })
    }

    chatProcessPrompt(text: string) {
        this.chat.push({text:text})
        this.chat.push({text:''})
        this.sentQuestion = true;
        this.scrollToBottom();
        this.forceBindChanges();

        this.chromeExtensionService.showSidebar('getAnswerListener');
        this.sendMessageToChatGpt(text);
        return;

        const respo:Observable<any> = this.apiService.getAnswerStreaming(text);
        const answers: any = [];
        this.chatPrompt = '';
        this.apiService.getAnswerStreaming(text).subscribe((event: any) => {
            if (this.sentQuestion) {
                this.limitAnswers()
            }
            if (event.type === HttpEventType.DownloadProgress) {
                const partialText = event.partialText
                console.log('partialText', partialText)
                answers.push(partialText);
                this.chat[this.chat.length - 1].text =  partialText;
                this.sentQuestion = false;
            }
            if (event.type === HttpEventType.Response) {
                const body = event.body;
                console.log('body', body)
                answers.push(body);
                this.chromeExtensionService.showSidebar('getAnswerListener 2');
                this.chatRequestInProgress = false;
                this.sentQuestion = false;
            }
            // console.log('answers', answers)
            // if (!answers.length) {
            //     this.chat[this.chat.length - 1].text =  'Something Went Wrong - Please Try Again';
            // }
            this.scrollToBottom();
            this.forceBindChanges();
        }, (err) => {
            if (err.status === 403) {
                // Forbidden - not exist
            }
            if (err.status === 401) {
                // Unauthorized
            }
            console.log('err', err)
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
        console.log('scrollToBottom')
        // if (!this.scrollInProgress) {
            console.log('scrollToBottom2')
            this.scrollInProgress = true;
            if (this.chatResultsScroll && this.chatResultsScroll.nativeElement) {
                console.log('this.chatResultsScroll.nativeElement.scrollHeight', this.chatResultsScroll.nativeElement.scrollHeight)
                $(this.chatResultsScroll.nativeElement).stop().animate({scrollTop: this.chatResultsScroll.nativeElement.scrollHeight}, 300, () => {
                    this.scrollInProgress = false;
                });
            } else {
                // window.scrollTo(0, document.body.scrollHeight);
            }
        // }
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

    uuidv4() {
        // @ts-ignore
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
            (
                c ^
                (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
            ).toString(16)
        );
    };

    createMessage(message: string) {
        return {
            action: "next",
            messages: [{
                id: this.uuidv4(),
                role: "user",
                content: {
                    content_type: "text",
                    parts: [message]
                }
            }],
            model: "text-davinci-002-render",
            parent_message_id: this.uuidv4()
        }
    }
    trySendingMessageToPort() {
        this.chatGptNeedToRefreshToken = false;
        this.chromeExtensionService.sendMessageToChatGpt('Knock knock');
    }
    sendMessageToChatGpt(msg: string) {
        if (this.chatGptNeedToRefreshToken) {
            this.chromeExtensionService.refreshGptToken();
        }
        this.chatGptNeedToRefreshToken = false;
        this.chatGptCurrentMessage = msg;
        this.chromeExtensionService.sendMessageToChatGpt(msg);
    }
    ListenToChatGpt() {
        this.chromeExtensionService.ListenFor('chatGptGotToken').subscribe((res) => {
            console.log('chatGptGotToken angular')
            this.chatGptNeedToRefreshToken = false;
            this.forceBindChanges();
        })
        this.chromeExtensionService.ListenFor('chatGptRequest').subscribe((res) => {
            if (res.answer && res.answer.done) {
                this.chatGptCurrentMessage = '';
                return;
            }
            if (res.answer) {
                if (res.answer === 'Unauthorized') {
                    this.chatGptNeedToRefreshToken = true;
                    this.chatGptCurrentMessage = '';
                    console.log('ListenToChatGpt Unauthorized msg', res)
                } else {
                    console.log('ListenToChatGpt msg', res)
                }
                if (res.answer !== this.chatGptCurrentMessage) {
                    this.chat[this.chat.length - 1].text = res.answer
                    this.sentQuestion = false
                    this.chatGptCurrentMessage = '';
                    this.scrollToBottom();
                }
                this.forceBindChanges();
            }
        })
    }

    ngOnDestroy(): void {
        this.privacyModelListener.unsubscribe();
    }
}
