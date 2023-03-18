import {ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {ApiService} from "../../services/api.service";
import {ChromeExtensionService} from "../../services/chrome-extension.service";
import {Config} from "../../config";
import {MyRouter} from "../my.router";
import {HttpEventType} from "@angular/common/http";
import {Observable} from "rxjs";
import {MessagesService} from "../../services/messages.service";

import {
    trigger,
    state,
    style,
    animate,
    transition,
    // ...
} from '@angular/animations';
import {maxWorkers} from "@angular-devkit/build-angular/src/utils/environment-options";

declare var $: any;
@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.less'],
    animations: [
        trigger('openClose', [
            state('options-expend', style({
                height: '350px',
            })),
            state('options-expend-small', style({
                height: '108px',
            })),
            state('options-expend-un-limit', style({
                height: '*',
            })),
            state('options-minimize', style({
                height: '20px',
            })),
            transition('options-expend => options-minimize', [
                animate('.3s ease-in-out')
            ]),
            transition('options-minimize => options-expend', [
                animate('.3s ease-in-out')
            ]),
            transition('options-expend-un-limit => options-minimize', [
                animate('.3s ease-in-out')
            ]),
            transition('options-minimize => options-expend-un-limit', [
                animate('.3s ease-in-out')
            ]),
            transition('options-expend-small => options-minimize', [
                animate('.3s ease-in-out')
            ]),
            transition('options-minimize => options-expend-small', [
                animate('.3s ease-in-out')
            ]),
        ])
    ]
})
export class MainComponent implements OnInit, OnDestroy {
    @ViewChild('chat_results_scroll') chatResultsScroll: ElementRef;
    @ViewChild('file_upload_results_scroll') fileUploadResultsScroll: ElementRef;
    allowUserPages = ['prompt-uploader', 'chat', 'settings'];
    allowCompanyPages = ['privacy-model'];
    page = 'chat';
    showOnce = false;

    // privacy model config
    modelResults: any;
    chat: any = [
        // {text: 'hi there'},
        // {text: 'hi there2 asdf asdf asf asd fasdf as fasdf as dfa sfas fas dfas fas dfasdf as fsadfasf asd fas fas dfas dfa sdf asdf asd fasd fasd fasd fasdf as fas'},
        // {text: ''},
    ]
    chatLimit = 50;
    chatMaxLength = 14300;
    chatMaxLengthHe = 3300;
    chatExpend = true;
    uploadPromptExpend = true;
    uploadPromptResultsExpend = true;
    sentQuestion = false;
    gotFirstAnswer = false;
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
    fileTask = ''
    fileSubmitInProgress = false;
    fileUploadErr = ''
    fileSubmitErr = ''
    fileUploadGptHtmlSplitChunks: any[] = [];
    fileUploadGptHtmlSplitResults: any[] = [];
    fileUploadResults = ''
    fileUploadScrollInProgress = false;
    promptSettings: any;

    subscriptions: any = []

    chatGptNeedToRefreshToken = false;
    chatGptCurrentMessage = '';
    chatGptCurrentResult = '';
    chatGptLastMessageId = '';
    chatGptConversationId = '';
    chatGptRequestGetConvIdProgress = false;
    chatGptHtmlSplitChunks: any[] = [];
    chatGptHtmlSplitResults: any[] = [];

    scrollInProgress = false;

    copyTextSuccess:number = -1;
    copyTextTimeout: any;

    constructor(
        private apiService: ApiService,
        private chromeExtensionService: ChromeExtensionService,
        private messagesService: MessagesService,
        private config: Config,
        private router:MyRouter,
        private ref:ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        console.log('init main component')
        this.setUpInitPage();
        this.endPoint = this.apiService.serverBase + this.apiService.baseApiUser + 'privacy-model';
        // console.log('init privacy model')
        // this.config.server_host_subject.subscribe(() => {
        //     this.host = this.config.hostToName();
        //     this.forceBindChanges();
        // })
        // this.config.user_subject.subscribe(() => {
        //     // this.promptOptimizer();
        // })
        this.listenToChromeContentScriptMessages();
        this.messagesService.ListenFor('change-main-page').subscribe((res: any) => {
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
            this.forceBindChanges();
        });

        // this.trySendingMessageToPort()
        this.ListenToChatGpt()
        // this.setPrivacyModelMockData();
        this.promptSettings = this.config.prompt_settings;
        this.subscriptions.push(
            this.config.prompt_settings_subject.subscribe((val) => {
                this.promptSettings = this.config.prompt_settings;
            })
        )
    }

    setUpInitPage() {
        console.log('this.config.is_company', this.config.is_company)
        if (this.config.is_company) {
            this.changePage('chat')
        } else {
            this.changePage('prompt-uploader')
        }
    }

    changePage(page: string) {
        this.page = page;
        this.messagesService.Broadcast('change-header-page', {page: this.page})
    }

    listenToChromeContentScriptMessages() {
        this.privacyModelListener = this.chromeExtensionService.ListenFor("privacy-model").subscribe((obj) => {
            // console.log('this.router.url',this.router.url)
            // this.page = 'privacy-model';
            this.changePage('privacy-model')
            const request = obj.request;
            const sender = obj.sender;
            const sendResponse = obj.sendResponse;
            const prompt = request.prompt;
            if (!this.config.is_company) {
                sendResponse({success: false, message: 'unauthorized'});
                this.apiService.collectUserPrompt(prompt).subscribe();
                this.forcePrompt();
                this.forceBindChanges();
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
                this.chromeExtensionService.showSidebar('ListenFor chat');
                return;
            }
            this.chatRequestInProgress = true;
            this.changePage('chat')
            const request = obj.request;
            const sender = obj.sender;
            const sendResponse = obj.sendResponse;
            const text = request.text;
            const title = request.title;
            this.chromeExtensionService.sendAnalytics('chat', title, {user_email: this.config.user?.email});
            if (request.noGptToken) {
                this.chatGptNeedToRefreshToken = true;
                this.chatRequestInProgress = false;
                this.chromeExtensionService.showSidebar('ListenFor chat');
                this.forceBindChanges();
                return;
            }
            this.chatGptNeedToRefreshToken = false;
            if (title === 'gaiaAllSummarize') {
                this.chromeExtensionService.sendMessageToContentScript('get-html', {content: 'text'}).then((res: any) => {

                    // option using upload file
                    // this.apiService.createTempFile(res.html).subscribe((res: any) => {
                    //     if (!res.err && res.data.file_url) {
                    //         const url_text = text + res.data.file_url;
                    //         this.chatProcessPrompt(url_text)
                    //     } else {
                    //         console.log('err', res.errMessage)
                    //         this.chatRequestInProgress = false;
                    //         this.forceBindChanges();
                    //         return;
                    //     }
                    //     console.log('res', res);
                    // }, (err) => {
                    //     console.log('err', err);
                    // })

                    // option using max length file
                    // let fullText = text + res.html;
                    // const maxLength = this.chatMaxLength;
                    // if (fullText.length > maxLength) {
                    //     fullText = fullText.substring(0, maxLength)
                    // }
                    // this.chatProcessPrompt(fullText)
                    // this.forceBindChanges();

                    // option using split to chunks
                    let maxLength = this.chatMaxLength;
                    if (this.isHebText(res.html)) {
                        maxLength = this.chatMaxLengthHe;
                    }
                    this.chatGptHtmlSplitChunks = [];
                    this.chatGptHtmlSplitChunks = this.splitStringToChunks(res.html, maxLength, text)
                    if (this.chatGptHtmlSplitChunks.length) {
                        const item = this.chatGptHtmlSplitChunks[0];
                        const fullText = item.before_text + item.text + item.after_text;
                        const message = 'please be patient while we are working on full page ' + item.before_text.replaceAll('\n', '');
                        if (this.chatGptHtmlSplitResults.length > 1) {
                            this.chatGptHtmlSplitResults.push(item.before_text);
                        }
                        this.chatGptHtmlSplitChunks.shift();
                        this.chatProcessPromptChunks(message, fullText)
                    } else {
                        this.chatRequestInProgress = false;
                        this.forceBindChanges();
                    }
                });
                // this.forceBindChanges();
                return;

            }
            // if (!this.config.is_company) {
            //     sendResponse({success: false, message: 'Unauthorized'});
            //     return;
            // }
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

    promptFromInput(text: string) {
        if (this.chatRequestInProgress) {
            return;
        }
        this.chatRequestInProgress = true;
        this.chatProcessPrompt(text)
    }

    chatProcessPromptChunks(text: string, text_to_send: string, collect_user_prompts = false) {
        if (text) {
            this.chat.push({text: text})
            this.chat.push({text: ''})
        }
        this.sentQuestion = true;
        this.gotFirstAnswer = false;
        if(collect_user_prompts) {
            this.apiService.collectUserPrompt(text_to_send).subscribe((res) => {}, (err) => {});
        }
        this.chatPrompt = '';
        this.chatExpend = false;
        this.forceBindChanges();

        this.chromeExtensionService.showSidebar('getAnswerListener');
        this.sendMessageToChatGpt(text_to_send);
        setTimeout(() => {
            this.scrollToBottom();
        })
    }

    chatProcessPrompt(text: string) {
        this.chat.push({text:text})
        this.chat.push({text:''})
        this.sentQuestion = true;
        this.gotFirstAnswer = false;
        this.apiService.collectUserPrompt(text).subscribe((res) => {}, (err) => {});
        this.chatPrompt = '';
        this.chatExpend = false;
        this.forceBindChanges();

        this.chromeExtensionService.showSidebar('getAnswerListener');
        this.sendMessageToChatGpt(text);
        setTimeout(() => {
            this.scrollToBottom();
        })
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

    fileUploadProcessPromptChunks(text_to_send: string, collect_user_upload_request = false) {
        this.sentQuestion = true;
        this.gotFirstAnswer = false;
        if(collect_user_upload_request) {
            // this.apiService.collectUserPrompt(text_to_send).subscribe((res) => {}, (err) => {});
        }
        this.uploadPromptExpend = false;
        this.forceBindChanges();

        this.sendFileTextToChatGpt(text_to_send);
        setTimeout(() => {
            this.fileResultsScrollToBottom();
        })
    }

    testPrivacyModelApi() {
        this.apiService.privacyModel('test', this.endPoint).subscribe(async (res) => {
            this.resultsModelTest = true;
            // this.forceBindChanges();
            console.log('res', res)
        }, (err) => {
            this.resultsModelTest = false;
            // this.forceBindChanges();
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

    copyText(text: string, index: number) {
        this.chromeExtensionService.sendMessageToContentScript('copy-text', {text: text}).then((res: any) => {
            if (res.success) {
                this.copyTextSuccess = index;
                clearTimeout(this.copyTextTimeout);
                this.copyTextTimeout = setTimeout(() => {
                    this.copyTextSuccess = -1;
                    this.forceBindChanges();
                }, 1000)
                this.forceBindChanges();
            } else {

            }
        });
    }

    splitStringToChunks(str: string, size: number, before_text: string) {
        const out: any[] = [];
        str = this.cleanStringBeforeChunk(str);
        console.log('splitStringToChunks main length', str.length)
        const splitter = '. ';
        let arr = str.split(splitter).map((o) => {return {text: o, splitter: splitter}});
        let inner_split: any = [];
        for (let i = 0; i <  arr.length; i++) {
            if (arr[i].text.length > size) {
                const splitter = '\n';
                let a = arr[i].text.split(splitter).map((o) => {return {text: o, splitter: splitter}});
                inner_split = inner_split.concat(a);
                arr.splice(i, 1);
                i--;
            }
        }
        console.log('arr before inner split', arr)
        arr = arr.concat(inner_split);
        console.log('arr before after split', arr)
        const before_text_length = (before_text + ':\n').length;
        for (let obj of arr) {
            if (out.length && out[out.length - 1].text.length + obj.text.length + obj.splitter.length + before_text_length < size ) {
                out[out.length - 1].text += obj.text + obj.splitter;
            } else {
                // const before_text = "FYI, no response necessary, No need to respond, just wanted to let you know: \n"
                out.push({before_text: before_text, text: obj.text, after_text: ''});
            }
        }
        // out[out.length - 1].after_text = '\n' + after_text + ', All Above text.';
        // out[out.length - 1].before_text = '';

        // out.push({before_text: '', text: after_text + ' Above ' + out.length + ' Outputs As One.', after_text: ''});
        // out.push({before_text: '', text: 'can you combine all answers into one answer?', after_text: ''});
        console.log('splitStringToChunks out', out)
        return out;
    }

    cleanStringBeforeChunk(str: string) {
        const clean_str = str;
        return clean_str;
    }

    scrollToBottom() {
        // console.log('scrollToBottom')
        // if (!this.scrollInProgress) {
        // console.log('scrollToBottom2')
        this.scrollInProgress = true;
        if (this.chatResultsScroll && this.chatResultsScroll.nativeElement) {
            // console.log('this.chatResultsScroll.nativeElement.scrollHeight', this.chatResultsScroll.nativeElement.scrollHeight)
            $(this.chatResultsScroll.nativeElement).stop().animate({scrollTop: this.chatResultsScroll.nativeElement.scrollHeight}, 300, () => {
                this.scrollInProgress = false;
            });
        } else {
            // window.scrollTo(0, document.body.scrollHeight);
        }
        // }
    }

    fileResultsScrollToBottom() {
        // console.log('fileResultsScrollToBottom')
        this.fileUploadScrollInProgress = true;
        if (this.fileUploadResultsScroll && this.fileUploadResultsScroll.nativeElement) {
            // console.log('this.fileUploadResultsScroll.nativeElement.scrollHeight', this.fileUploadResultsScroll.nativeElement.scrollHeight)
            $(this.fileUploadResultsScroll.nativeElement).stop().animate({scrollTop: this.fileUploadResultsScroll.nativeElement.scrollHeight}, 300, () => {
                this.fileUploadScrollInProgress = false;
            });
        } else {
            // window.scrollTo(0, document.body.scrollHeight);
        }
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

    resetFileValues() {
        this.fileUploadErr = '';
        this.fileSubmitErr = '';
        this.fileText = '';
        this.fileName = '';
        this.fileTask = '';
        this.fileUploadResults = '';
    }

    uploadFiles(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files as FileList;
        this.resetFileValues();
        const file = files[0]
        this.fileName = file.name;
        // console.log('type', file.name);
        if (file.type === 'text/plain') {
            this.readFile(event, file)
        } else {
            this.fileUploadErr = 'please upload txt file only';
        }
    }

    async filesDropped(files: FileList) {
        this.resetFileValues();
        const file = files[0]
        this.fileName = file.name;
        // console.log('type', file.name);
        if (file.type === 'text/plain') {
            this.readFile(null, file)
        } else {
            this.fileUploadErr = 'please upload txt file only';
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
            // console.log('fileReader.result', fileReader.result)
            // console.log(fileReader.result);
            if (fileReader.result) {
                const text = fileReader.result.toString();
                // if (text.length > this.chatMaxLength) {
                //     this.fileUploadErr = 'currently we support max text length of ' + this.chatMaxLength;
                // } else {
                    this.fileText = fileReader.result.toString();
                    this.fileUploadErr = '';
                    this.uploadPromptExpend = true;
                // }
                if (event && event.target) {
                    event.target.value = '';
                }
            }

        }
        fileReader.readAsText(file);
    }

    submitFileUpload() {
        if (!this.fileText) {
            this.fileSubmitErr = 'please upload txt file';
            return;
        }
        if (!this.fileTask) {
            this.fileSubmitErr = 'please select task';
            return;
        }
        if (this.chatRequestInProgress) {
            this.fileSubmitErr = 'please wait while current task finish';
            return;
        }
        // if (this.fileText.length > this.chatMaxLength) {
        //     this.fileSubmitErr = 'currently we support max text length of ' + this.chatMaxLength;
        //     return;
        // }
        this.chatRequestInProgress = true;
        this.fileSubmitInProgress = true;
        this.fileSubmitErr = '';
        let maxLength = this.chatMaxLength;
        if (this.isHebText(this.fileText)) {
            maxLength = this.chatMaxLengthHe;
        }
        this.fileUploadGptHtmlSplitChunks = [];
        this.fileUploadGptHtmlSplitChunks = this.splitStringToChunks(this.fileText, maxLength, this.fileTask)
        if (this.fileUploadGptHtmlSplitChunks.length) {
            const item = this.fileUploadGptHtmlSplitChunks[0];
            const fullText = item.before_text + ':\n' + item.text + item.after_text;
            const message = 'please be patient while we are working on your file';
            this.fileUploadResults = message;
            if (this.fileUploadGptHtmlSplitChunks.length > 1) {
                this.fileUploadGptHtmlSplitResults.push(item.before_text);
            }
            this.fileUploadGptHtmlSplitChunks.shift();
            this.fileUploadProcessPromptChunks(fullText)
        } else {
            this.fileSubmitInProgress = false;
            this.forceBindChanges();
        }
        // const prompt = this.fileTask + ':\n\n' + this.fileText;
        // console.log('prompt', prompt)
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
        console.log('sending msg from chat ', msg.length)
        this.chromeExtensionService.sendMessageToChatGpt(msg, this.chatGptConversationId, this.chatGptLastMessageId);
    }

    sendFileTextToChatGpt(msg: string) {
        if (this.chatGptNeedToRefreshToken) {
            this.chromeExtensionService.refreshGptToken();
        }
        this.chatGptNeedToRefreshToken = false;
        console.log('sending msg from file upload ', msg.length)
        this.chromeExtensionService.sendMessageToChatGpt(msg, '', this.chatGptLastMessageId);
    }

    ListenToChatGpt() {
        this.chromeExtensionService.ListenFor('chatGptGotToken').subscribe((res) => {
            console.log('got from chatGptGotToken', res)
            console.log('chatGptGotToken angular')
            this.chatGptNeedToRefreshToken = false;
            this.forceBindChanges();
        })
        // this.chromeExtensionService.ListenFor('chatGptGetConversation').subscribe((res) => {
        //     console.log('got from chatGptGetConversation', res)
        //     this.chatGptConversationId = res.lastConversationId;
        //     this.chatGptRequestGetConvIdProgress = false;
        //     // const msg = this.chromeExtensionService.genTitleMessage(this.chatGptConversationId);
        //     // this.chromeExtensionService.generalSendMessageToChatGpt('chatGptGenTitle', msg)
        //     const msg = this.chromeExtensionService.genModerationsMessage(this.chatGptConversationId, this.chatGptCurrentMessage);
        //     this.chromeExtensionService.generalSendMessageToChatGpt('chatGptGenModerations', msg)
        // })
        // this.chromeExtensionService.ListenFor('chatGptGenModerations').subscribe((res) => {
        //     // res.title
        //     console.log('got from chatGptGenModerations', res)
        //
        // })
        this.chromeExtensionService.ListenFor('chatGptGenTitle').subscribe((res) => {
            // res.title
            console.log('got from chatGptGenTitle', res)

        })
        this.chromeExtensionService.ListenFor('chatGptRequest').subscribe((res) => {
            console.log('ListenToChatGpt res.answer', res.answer)
            if (res.answer && res.answer.done) {
                console.log('res.answer.done', res.answer.done)
                if (this.fileSubmitInProgress) {
                    console.log('this.fileUploadGptHtmlSplitChunks', this.fileUploadGptHtmlSplitChunks)
                    console.log('this.fileUploadGptHtmlSplitResults', this.fileUploadGptHtmlSplitResults)
                    if (this.fileUploadGptHtmlSplitChunks.length) {
                        this.fileUploadGptHtmlSplitResults.push(this.chatGptCurrentResult)
                        const item = this.fileUploadGptHtmlSplitChunks[0];
                        const fullText = item.before_text + ':\n' + item.text + item.after_text;
                        this.fileUploadGptHtmlSplitChunks.shift();
                        this.fileUploadProcessPromptChunks(fullText)
                    } else if (this.fileUploadGptHtmlSplitResults.length) {
                        const final_text = this.fileUploadGptHtmlSplitResults.join('\n')
                        this.fileUploadGptHtmlSplitResults = [];
                        this.fileUploadProcessPromptChunks(final_text, true)
                    } else {
                        this.fileSubmitInProgress = false;
                        this.chatRequestInProgress = false;
                        this.uploadPromptResultsExpend = true;
                        this.forceBindChanges();
                    }
                } else {
                    this.resetItems();
                    console.log('this.chatGptHtmlSplitChunks', this.chatGptHtmlSplitChunks)
                    console.log('this.chatGptHtmlSplitResults', this.chatGptHtmlSplitResults)
                    if (this.chatGptHtmlSplitChunks.length) {
                        this.chatGptHtmlSplitResults.push(this.chatGptCurrentResult)
                        const item = this.chatGptHtmlSplitChunks[0];
                        console.log('item', item)
                        const fullText = item.before_text + item.text + item.after_text;
                        console.log('fullText.length', fullText.length)
                        this.chatGptHtmlSplitChunks.shift();
                        this.chatProcessPromptChunks('', fullText)
                    } else if (this.chatGptHtmlSplitResults.length) {
                        const final_text = this.chatGptHtmlSplitResults.join('\n')
                        this.chatGptHtmlSplitResults = [];
                        console.log('final_text', final_text)
                        console.log('final_text.length', final_text.length)
                        this.chatProcessPromptChunks('', final_text, true)
                    } else {
                        const msg = this.chromeExtensionService.genTitleMessage(this.chatGptConversationId, this.chatGptLastMessageId);
                        this.chromeExtensionService.generalSendMessageToChatGpt('chatGptGenTitle', msg)
                    }
                }

                return;
            }
            if (res.answer) {
                if (res.answer.err) {
                    if (this.fileSubmitInProgress) {
                        this.fileUploadResults = res.answer.errMessage;
                        this.fileSubmitInProgress = false;
                        this.chatRequestInProgress = false;
                        if (res.answer.errMessage === 'Unauthorized') {
                            this.chatGptNeedToRefreshToken = true;
                        }
                    } else {
                        console.log('ListenToChatGpt msg', res)
                        this.changePage('chat');
                        this.resetItems(res.answer.errMessage);
                        if (res.answer.errMessage === 'Unauthorized') {
                            this.chatGptNeedToRefreshToken = true;
                        }
                    }
                    return
                } else if (res.answer.text !== this.chatGptCurrentMessage) {
                    if (this.fileSubmitInProgress) {
                        this.chatGptCurrentResult = res.answer.text;
                        if (!this.fileUploadGptHtmlSplitChunks.length && !this.fileUploadGptHtmlSplitResults.length) {
                            this.fileUploadResults = this.chatGptCurrentResult;
                            this.fileResultsScrollToBottom();
                        }
                    } else {
                        let conversation_id = '';
                        let message_id = '';
                        if (res.answer.data) {
                            conversation_id = res.answer.data.conversation_id;
                            message_id = res.answer.data.message.id;
                        }
                        // console.log('ListenToChatGpt conversation_id', conversation_id)
                        // console.log('ListenToChatGpt message_id', message_id)
                        if (conversation_id) {
                            this.chatGptConversationId = conversation_id;
                        }
                        if (message_id) {
                            this.chatGptLastMessageId = message_id;
                        }
                        this.chatGptCurrentResult = res.answer.text;
                        if (!this.gotFirstAnswer) {
                            this.chatPrompt = '';
                            this.gotFirstAnswer = true;
                        }
                        if (!this.chatGptHtmlSplitChunks.length && !this.chatGptHtmlSplitResults.length) {
                            this.chat[this.chat.length - 1].text = this.chatGptCurrentResult;
                            this.sentQuestion = false
                        }
                        // this.chatGptCurrentMessage = '';
                        this.scrollToBottom();
                    }
                } else {
                    console.log('ListenToChatGpt something went wrong res.answer', res)
                    // this.resetItems('something went wrong res.answer');
                    return;
                }
                this.forceBindChanges();

                // if (res.answer.toManyRequests) {
                //     if (this.fileSubmitInProgress) {
                //         this.fileUploadResults = res.answer.text;
                //         this.fileSubmitInProgress = false;
                //         this.chatRequestInProgress = false
                //     } else {
                //         console.log('ListenToChatGpt toManyRequests msg', res)
                //         this.changePage('chat');
                //         this.resetItems(res.answer.text);
                //     }
                //     return
                // } else if (res.answer.messageLength) {
                //     if (this.fileSubmitInProgress) {
                //         this.fileUploadResults = res.answer.text;
                //         this.fileSubmitInProgress = false;
                //         this.chatRequestInProgress = false
                //     } else {
                //         console.log('ListenToChatGpt messageLength msg', res)
                //         this.changePage('chat');
                //         this.resetItems(res.answer.text);
                //     }
                //     return
                // } else if (res.answer.text === 'Unauthorized') {
                //     if (this.fileSubmitInProgress) {
                //         // this.fileUploadResults = res.answer.text;
                //         this.fileSubmitInProgress = false;
                //         this.chatRequestInProgress = false
                //         this.chatGptNeedToRefreshToken = true;
                //     } else {
                //         console.log('ListenToChatGpt Unauthorized msg', res)
                //         this.changePage('chat');
                //         this.chatGptNeedToRefreshToken = true;
                //         if (res.answer.detail) {
                //             this.resetItems(res.answer.detail);
                //         } else {
                //             this.resetItems(res.answer.text);
                //         }
                //     }
                //     return
                // } else if (res.answer.text !== this.chatGptCurrentMessage) {
                //     if (this.fileSubmitInProgress) {
                //         this.chatGptCurrentResult = res.answer.text;
                //         if (!this.fileUploadGptHtmlSplitChunks.length && !this.fileUploadGptHtmlSplitResults.length) {
                //             this.fileUploadResults = this.chatGptCurrentResult;
                //             this.fileResultsScrollToBottom();
                //         }
                //     } else {
                //         let conversation_id = '';
                //         let message_id = '';
                //         if (res.answer.data) {
                //             conversation_id = res.answer.data.conversation_id;
                //             message_id = res.answer.data.message.id;
                //         }
                //         // console.log('ListenToChatGpt conversation_id', conversation_id)
                //         // console.log('ListenToChatGpt message_id', message_id)
                //         if (conversation_id) {
                //             this.chatGptConversationId = conversation_id;
                //         }
                //         if (message_id) {
                //             this.chatGptLastMessageId = message_id;
                //         }
                //         this.chatGptCurrentResult = res.answer.text;
                //         if (!this.gotFirstAnswer) {
                //             this.chatPrompt = '';
                //             this.gotFirstAnswer = true;
                //         }
                //         if (!this.chatGptHtmlSplitChunks.length && !this.chatGptHtmlSplitResults.length) {
                //             this.chat[this.chat.length - 1].text = this.chatGptCurrentResult;
                //             this.sentQuestion = false
                //         }
                //         // this.chatGptCurrentMessage = '';
                //         this.scrollToBottom();
                //     }
                // } else {
                //     console.log('ListenToChatGpt something went wrong res.answer', res)
                //     // this.resetItems('something went wrong res.answer');
                //     return;
                // }
                // this.forceBindChanges();
            } else {
                console.log('ListenToChatGpt something went wrong msg', res)
                this.resetItems('something went wrong');
                this.forceBindChanges();
            }
        })
    }

    toggleChatOptions() {
        this.chatExpend = !this.chatExpend;
    }
    togglePromptOptions() {
        this.uploadPromptExpend = !this.uploadPromptExpend;
    }
    togglePromptResultsOptions() {
        this.uploadPromptResultsExpend = !this.uploadPromptResultsExpend;
    }
    saveCurrentFileUploadResults() {
        const link = document.createElement("a");
        var file = new Blob([this.fileUploadResults],
            { type: "text/plain;charset=utf-8" });
        link.href = URL.createObjectURL(file);
        link.download = "results.txt";
        link.click();
        URL.revokeObjectURL(link.href);
    }

    resetItems(text: string = '') {
        this.chatGptCurrentMessage = '';
        this.chatRequestInProgress = false;
        this.sentQuestion = false;
        if (text) {
            this.chat[this.chat.length - 1].text = text;
        }
        this.forceBindChanges();
    }

    contains_heb(str: string) {
        return (/[\u0590-\u05FF]/).test(str);
    }

    charCountHeb( str: string, regex: any ) {
        var l = str.length;
        return l - str.replace( regex, "").length;
    }

    isHebText(str: string) {
        const regex = /[\u0590-\u05FF]/g;
        const charCount = this.charCountHeb(str, regex)
        if (charCount > (str.length / 2)) {
            return true;
        } else {
            return false;
        }
    }

    ngOnDestroy(): void {
        this.privacyModelListener.unsubscribe();
        this.messagesService.ClearEvent('change-main-page');
        for (let item of this.subscriptions) {
            item.unsubscribe()
        }
    }
}
