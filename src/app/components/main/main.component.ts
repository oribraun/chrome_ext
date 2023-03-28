import {ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {ApiService} from "../../services/api.service";
import {ChromeExtensionService} from "../../services/chrome-extension.service";
import {Config} from "../../config";
import {MyRouter} from "../my.router";
import {HttpEventType} from "@angular/common/http";
import {Observable} from "rxjs";
import {MessagesService} from "../../services/messages.service";
import * as pdfjsLib from "pdfjs-dist";
import { jsPDF } from "jspdf";
import * as XLSX from 'xlsx';
import { Document, Paragraph, Packer, TextRun } from 'docx';
// import Docxtemplater from 'docxtemplater';
// import PizZip from 'pizzip';

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
declare var mammoth: any;

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
    chatExpend = true;
    uploadPromptExpend = true;
    uploadPromptResultsExpend = true;

    endPoint: any
    host: any
    user: any;
    resultsModelTest: any;
    privacyModelListener: any;
    getAnswerListener: any;

    // chat config
    chatLimit = 50;
    chatMaxLength = 13000;
    chatMaxLengthHe = 3000;
    chat: any = [
        // {text: 'hi there'},
        // {text: ''},
        // {text: 'hi there2 asdf asdf asf asd fasdf as fasdf as dfa sfas fas dfas fas dfasdf as fsadfasf asd fas fas dfas dfa sdf asdf asd fasd fasd fasd fasdf as fas'},
    ]
    sentQuestionToChat = false;
    gotFirstAnswerFromChat = false;
    chatGptRequestInProgress = false;
    chatGptRequestError = false;
    chatPrompt = '';
    chatGptNeedToRefreshToken = false;
    chatGptCurrentMessage = '';
    chatGptCurrentResult = '';
    chatGptLastMessageId = '';
    chatGptConversationId = '';
    chatGptHtmlSplitChunks: any[] = [];
    chatGptHtmlSplitResults: any[] = [];
    chatGptHtmlTotalChunks: number = -1;
    chatGptHtmlProgress: number = -1;
    scrollInProgress = false;
    chatShowStopButton = false;

    // file upload config
    fileText = ''
    fileType = ''
    fileName = ''
    fileTask = ''
    fileLoading = false;
    fileUploadErr = ''
    fileSubmitErr = ''
    fileUploadGptHtmlSplitChunks: any[] = [];
    fileUploadGptHtmlSplitResults: any[] = [];
    fileUploadGptHtmlTotalChunks: number = -1;
    fileUploadGptHtmlProgress: number = -1;
    fileUploadResults = ''
    fileSubmitInProgress = false;
    fileUploadScrollInProgress = false;
    fileChatGptLastMessageId = '';
    fileChatGptConversationId = '';
    fileChatShowStopButton = false;
    fileSaveMap: any = {
        txt: {type: 'text/plain;charset=utf-8'},
        pdf: {type: 'application/pdf;charset=utf-8'},
        csv: {type: 'text/csv;charset=utf-8'},
        // xlsx: {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8,'},
        docx: {type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=UTF-8,'}
    }
    promptSettings: any;

    subscriptions: any = []

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
        this.messagesService.ListenFor('sidebar-expend').subscribe((res: any) => {
            if (this.page === 'chat') {
                setTimeout(() => {
                    this.scrollToBottom(true);
                }, 200);
            } else if (this.page === 'prompt-uploader') {
                setTimeout(() => {
                    this.fileResultsScrollToBottom(true);
                }, 200);
            }
        })
        this.messagesService.ListenFor('change-main-page').subscribe((res: any) => {
            let array = this.allowUserPages;
            if (this.config.is_company) {
                array = array.concat(this.allowCompanyPages);
            }
            if (array.indexOf(res.page) > -1) {
                this.page = res.page;
                if (this.page === 'chat') {
                    setTimeout(() => {
                        this.scrollToBottom(true);
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
                const titles = this.promptSettings.map((o: any) => o.title);
                if (titles.indexOf(this.fileTask) === -1) {
                    this.fileTask = '';
                }
            })
        )
        // setTimeout(() => {
        //     this.testChatScroll()
        // })
    }

    testChatScroll() {
        this.chat = [
            {text: 'hi there'},
            {text: ''}
        ]
        setInterval(() => {
            this.chat[this.chat.length - 1].text += ' a';
            // this.addChatScrollListener();
            this.scrollToBottom();
        }, 100)
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
            if (this.chatGptRequestInProgress) {
                this.chromeExtensionService.showSidebar('ListenFor chat');
                return;
            }
            this.resetItems();
            this.changePage('chat')
            const request = obj.request;
            const sender = obj.sender;
            const sendResponse = obj.sendResponse;
            const text = request.text;
            const title = request.title;
            if (request.noGptToken) {
                this.chatGptNeedToRefreshToken = true;
                this.chatGptRequestInProgress = false;
                this.chatGptRequestError = false;
                this.chromeExtensionService.showSidebar('ListenFor chat');
                this.forceBindChanges();
                this.sendChatAnalytics(text, 'noGptToken');
                return;
            }

            this.chatGptRequestInProgress = true;
            this.chatGptNeedToRefreshToken = false;

            this.sendChatAnalytics(text, title);

            if (title === 'gaiaAllSummarize') {
                this.chromeExtensionService.sendMessageToContentScript('get-html', {content: 'text'}).then((res: any) => {

                    // option using upload file
                    // this.apiService.createTempFile(res.html).subscribe((res: any) => {
                    //     if (!res.err && res.data.file_url) {
                    //         const url_text = text + res.data.file_url;
                    //         this.chatProcessPrompt(url_text)
                    //     } else {
                    //         console.log('err', res.errMessage)
                    //         this.chatGptRequestInProgress = false;
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
                    this.chatGptHtmlProgress = 0;
                    console.log('splitStringToChunks gaiaAllSummarize')
                    this.chatGptHtmlSplitChunks = this.splitStringToChunks(res.html, maxLength, text)
                    this.chatGptHtmlTotalChunks = this.chatGptHtmlSplitChunks.length;
                    console.log('this.chatGptHtmlTotalChunks', this.chatGptHtmlTotalChunks)
                    if (this.chatGptHtmlSplitChunks.length) {
                        const item = this.chatGptHtmlSplitChunks[0];
                        const fullText = item.before_text + item.text + item.after_text;
                        const message = 'please be patient while we are working on full page ' + item.before_text.replaceAll('\n', '');
                        if (this.chatGptHtmlSplitChunks.length > 1) {
                            // this.chatGptHtmlSplitResults.push(item.before_text);
                        }
                        this.chatGptHtmlSplitChunks.shift();
                        this.chatProcessPromptChunks(message, fullText)
                    } else {
                        this.resetItems();
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
            //     this.sentQuestionToChat = false;
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

    preventTextAreaEnter(e: any) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
        }
    }

    promptFromInput(text: string) {
        if (this.chatGptRequestInProgress) {
            return;
        }
        this.chatGptRequestInProgress = true;
        this.chatGptRequestError = false;
        this.sendChatAnalytics(text, 'manual-prompt')
        this.chatProcessPrompt(text)
    }

    chatProcessPromptChunks(text: string, text_to_send: string, collect_user_prompts = false) {
        if (text) {
            this.chat.push({text: text, done: true})
            this.chat.push({text: '', done: false})
            setTimeout(() => {
                this.scrollToBottom(true);
            }, 200);
        }
        this.sentQuestionToChat = true;
        this.gotFirstAnswerFromChat = false;
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
        }, 200)
    }

    chatProcessPrompt(text: string) {
        this.chat.push({text:text, done: true})
        this.chat.push({text:'', done:false})
        this.sentQuestionToChat = true;
        this.gotFirstAnswerFromChat = false;
        this.apiService.collectUserPrompt(text).subscribe((res) => {}, (err) => {});
        this.chatPrompt = '';
        this.chatExpend = false;
        this.forceBindChanges();

        this.chromeExtensionService.showSidebar('getAnswerListener');
        //this.sendMessageToChatGpt(text);
        setTimeout(() => {
            this.scrollToBottom(true);
        }, 200)
        //return;

        //const respo:Observable<any> = this.apiService.getAnswerStreaming(text);
        const answers: any = [];
        this.chatPrompt = '';
        this.apiService.getAnswerStreaming(text).subscribe((event: any) => {
            if (this.sentQuestionToChat) {
                this.limitAnswers()
            }
            if (event.type === HttpEventType.DownloadProgress) {
                const partialText = event.partialText
                console.log('partialText', partialText)
                answers.push(partialText);
                this.chat[this.chat.length - 1].text =  partialText;
                this.sentQuestionToChat = false;
            }
            if (event.type === HttpEventType.Response) {
                const body = event.body;
                console.log('body', body)
                answers.push(body);
                this.chromeExtensionService.showSidebar('getAnswerListener 2');
                this.chatGptRequestInProgress = false;
                this.chatGptRequestError = false;
                this.sentQuestionToChat = false;
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
        this.sentQuestionToChat = true;
        this.gotFirstAnswerFromChat = false;
        if(collect_user_upload_request) {
            // this.apiService.collectUserPrompt(text_to_send).subscribe((res) => {}, (err) => {});
        }
        this.uploadPromptExpend = false;
        this.forceBindChanges();

        this.sendFileTextToChatGpt(text_to_send);
        setTimeout(() => {
            this.fileResultsScrollToBottom();
        }, 200)
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
        // console.log('arr before inner split', arr)
        arr = arr.concat(inner_split);
        // console.log('arr before after split', arr)
        const before_text_length = (before_text).length;
        const after_text = '';
        const after_text_length = (after_text).length;
        for (let obj of arr) {
            if (out.length && out[out.length - 1].text.length + obj.text.length + obj.splitter.length + before_text_length + after_text_length < size ) {
                out[out.length - 1].text += obj.text + obj.splitter;
            } else {
                // const before_text = "FYI, no response necessary, No need to respond, just wanted to let you know: \n"
                out.push({before_text: before_text, text: obj.text, after_text: after_text});
            }
        }
        // out[out.length - 1].after_text = '\n' + after_text + ', All Above text.';
        // out[out.length - 1].before_text = '';

        // out.push({before_text: '', text: after_text + ' Above ' + out.length + ' Outputs As One.', after_text: ''});
        if (out.length > 1) {
            const clean_before_text = before_text.replace(/:/g, '').replace(/\n/g, '');
            out.push({before_text: '', text: 'combine the ' + clean_before_text + ' sections to get a fully detailed ' + clean_before_text, after_text: ''});
        }
        // console.log('splitStringToChunks out', out)
        return out;
    }

    cleanStringBeforeChunk(str: string) {
        const clean_str = str;
        return clean_str;
    }

    scrollToBottom(force = false) {
        if (this.chatResultsScroll) {
            const element = this.chatResultsScroll.nativeElement;
            if (element) {
                // const rect = element.getBoundingClientRect();
                const fileUploadResultsElement = element.querySelector('.computer-prompt:last-child');
                // console.log('fileUploadResultsElement', fileUploadResultsElement);
                let lineHeight = 0;
                if (fileUploadResultsElement) {
                    const style = window.getComputedStyle(fileUploadResultsElement);
                    lineHeight = Math.ceil(parseFloat(style.lineHeight))
                }
                // console.log('lineHeight', lineHeight)
                // console.log('element.scrollHeight', element.scrollHeight)
                // console.log('element.scrollTop', element.scrollTop)
                // console.log('element.offsetHeight', element.offsetHeight)
                // console.log('element.scrollHeight - element.scrollTop - element.offsetHeight', Math.floor(Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight)))


                if (Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) <= 1
                    || Math.floor(Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight)) === lineHeight
                    || force) {
                    this.scrollInProgress = true;
                    this.chatResultsScroll.nativeElement.scrollTop = this.chatResultsScroll.nativeElement.scrollHeight;
                    setTimeout(() => {
                        if (this.chatResultsScroll && this.chatResultsScroll.nativeElement) {
                            this.chatResultsScroll.nativeElement.scrollTop = this.chatResultsScroll.nativeElement.scrollHeight;
                        }
                        this.scrollInProgress = false;
                    }, 200)
                    // $(this.chatResultsScroll.nativeElement).stop().animate({scrollTop: this.chatResultsScroll.nativeElement.scrollHeight}, 300, () => {
                    //     this.scrollInProgress = false;
                    // });
                } else {
                    // window.scrollTo(0, document.body.scrollHeight);
                }
            }
        }
    }

    fileResultsScrollToBottom(force = false) {
        if (this.fileUploadResultsScroll) {
            const element = this.fileUploadResultsScroll.nativeElement;
            if (element) {
                // const rect = element.getBoundingClientRect();
                const fileUploadResultsElement = element.querySelector('.computer-prompt:last-child');
                // console.log('fileUploadResultsElement', fileUploadResultsElement);
                let lineHeight = 0;
                if (fileUploadResultsElement) {
                    const style = window.getComputedStyle(fileUploadResultsElement);
                    lineHeight = Math.ceil(parseFloat(style.lineHeight))
                }
                // console.log('lineHeight', lineHeight)
                // console.log('element.scrollHeight', element.scrollHeight)
                // console.log('element.scrollTop', element.scrollTop)
                // console.log('element.offsetHeight', element.offsetHeight)
                // console.log('element.scrollHeight - element.scrollTop - element.offsetHeight', Math.floor(Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight)))

                if (Math.abs(element.scrollHeight - element.scrollTop - element.offsetHeight) <= 1
                    || Math.floor(Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight)) === lineHeight
                    || force) {
                    this.fileUploadScrollInProgress = true;
                    this.fileUploadResultsScroll.nativeElement.scrollTop = this.fileUploadResultsScroll.nativeElement.scrollHeight;
                    setTimeout(() => {
                        if (this.fileUploadResultsScroll && this.fileUploadResultsScroll.nativeElement) {
                            this.fileUploadResultsScroll.nativeElement.scrollTop = this.fileUploadResultsScroll.nativeElement.scrollHeight;
                        }
                        this.fileUploadScrollInProgress = false;
                    }, 200)
                    // $(element.).stop().animate({scrollTop: element..scrollHeight}, 300, () => {
                    //     this.scrollInProgress = false;
                    // });
                } else {
                    // window.scrollTo(0, document.body.scrollHeight);
                }
            }
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
        this.fileChatShowStopButton = false;
        // this.fileUploadResults = '';
    }

    uploadFiles(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files as FileList;
        this.resetFileValues();
        const file = files[0]
        this.fileName = file.name;
        // console.log('type', file.type);
        this.handleFile(event, file);
    }

    async filesDropped(files: FileList) {
        this.resetFileValues();
        const file = files[0]
        this.fileName = file.name;
        // console.log('type', file.name);
        this.handleFile(null, file);
    }

    handleFile(event: any, file: File) {
        this.fileType = file.type;
        if (file.type === 'text/plain') {
            this.readFile(event, file)
        } else if (file.type === 'text/csv') {
            this.readCsvFile(event, file)
        } else if (file.type === 'application/pdf') {
            this.readPdfFile(event, file)
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            this.readXlsxFile(event, file)
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            this.readDocxFile(event, file)
        } else {
            this.fileUploadErr = 'please upload txt/pdf file only';
        }
    }

    readFile(event: any,file: File) {
        let fileReader = new FileReader();
        fileReader.onload = (e) => {
            // console.log('fileReader.result', fileReader.result)
            // console.log(fileReader.result);
            if (fileReader.result) {
                // const text = fileReader.result.toString();
                // if (text.length > this.chatMaxLength) {
                //     this.fileUploadErr = 'currently we support max text length of ' + this.chatMaxLength;
                // } else {
                this.fileText = this.cleanText(fileReader.result.toString());
                this.fileUploadErr = '';
                this.uploadPromptExpend = true;
                // }
                if (event && event.target) {
                    event.target.value = '';
                }
                this.forceBindChanges();
            } else {
                this.fileUploadErr = 'no file content';
            }

        }
        fileReader.onerror = (event) => {
            // console.log('error reading file', event);
            this.fileLoading = false;
            this.fileUploadErr = 'error in reading file';
            this.forceBindChanges();
        };
        fileReader.readAsText(file);
    }

    readCsvFile(event: any,file: File) {
        let fileReader = new FileReader();
        fileReader.onload = (e) => {
            if (fileReader.result) {
                this.fileText = fileReader.result.toString();
                this.fileUploadErr = '';
                this.uploadPromptExpend = true;
                // }
                if (event && event.target) {
                    event.target.value = '';
                }
                this.forceBindChanges();
            } else {
                this.fileUploadErr = 'no file content';
            }

        }
        fileReader.onerror = (event) => {
            // console.log('error reading file', event);
            this.fileLoading = false;
            this.fileUploadErr = 'error in reading file';
            this.forceBindChanges();
        };
        fileReader.readAsText(file);
    }

    readPdfFile(event: any,file: File) {
        this.fileLoading = true;
        let fileReader = new FileReader();
        fileReader.onload = (e) => {
            // console.log('fileReader.result', fileReader.result)
            // console.log(fileReader.result);
            if (fileReader.result) {
                // @ts-ignore
                var typedarray = new Uint8Array(fileReader.result);
                //Step 5:pdfjs should be able to read this
                pdfjsLib.GlobalWorkerOptions.workerSrc = "assets/pdf.worker.min.js";
                const loadingTask = pdfjsLib.getDocument(typedarray);
                loadingTask.promise.then((pdf: any) => {
                    var maxPages = pdf.numPages;
                    var countPromises = []; // collecting all page promises
                    for (var j = 1; j <= maxPages; j++) {
                        var page = pdf.getPage(j);

                        countPromises.push(page.then(function(page: any) { // add page promise
                            var textContent = page.getTextContent();
                            return textContent.then(function(text: any){ // return content promise
                                return text.items.map(function (s: any) { return s.str; }).join(' '); // value page text
                            });
                        }));
                    }
                    // Wait for all pages and join text
                    return Promise.all(countPromises).then((texts) => {
                        this.fileText = this.cleanText(texts.join(''));
                        // console.log('this.fileText', this.fileText)
                        this.fileUploadErr = '';
                        this.uploadPromptExpend = true;
                        this.fileLoading = false;
                        this.forceBindChanges();
                        return texts.join(' ');
                    }).catch((err) => {
                        this.fileUploadErr = err.message;
                        this.forceBindChanges();
                    });
                });
                if (event && event.target) {
                    event.target.value = '';
                }
            } else {
                this.fileUploadErr = 'no file content';
            }

        }
        fileReader.onerror = (event) => {
            // console.log('error reading file', event);
            this.fileLoading = false;
            this.fileUploadErr = 'error in reading file';
            this.forceBindChanges();
        };
        fileReader.readAsArrayBuffer(file);
    }

    readDocxFile(event: any,file: File) {
        this.fileLoading = true;
        let fileReader = new FileReader();
        fileReader.onload = (e) => {
            // console.log('fileReader.result', fileReader.result)
            // console.log(fileReader.result);
            if (fileReader.result) {
                // @ts-ignore
                mammoth.extractRawText({arrayBuffer: fileReader.result})
                    .then((result: any) => {
                        var text = this.cleanText(result.value); // The raw text
                        this.fileText = text;
                        this.fileLoading = false;
                        this.forceBindChanges();

                    }).catch((err: any) => {
                    this.fileUploadErr = err.message;
                    this.fileLoading = false;
                    this.forceBindChanges();
                }).done();
                if (event && event.target) {
                    event.target.value = '';
                }
            } else {
                this.fileUploadErr = 'no file content';
            }

        }
        fileReader.onerror = (event) => {
            // console.log('error reading file', event);
            this.fileLoading = false;
            this.fileUploadErr = 'error in reading file';
            this.forceBindChanges();
        };
        fileReader.readAsArrayBuffer(file);
    }

    readXlsxFile(event: any,file: File) {
        this.fileLoading = true;
        let fileReader = new FileReader();
        fileReader.onload = (e) => {
            // console.log('fileReader.result', fileReader.result)
            // console.log(fileReader.result);
            if (fileReader.result) {
                // @ts-ignore
                try {
                    const string = fileReader.result.toString();
                    const wb: XLSX.WorkBook = XLSX.read(string, {type: 'binary'});
                    /* selected the first sheet */
                    const wsname: string = wb.SheetNames[0];
                    const ws: XLSX.WorkSheet = wb.Sheets[wsname];

                    /* save data */
                    const text = XLSX.utils.sheet_to_txt(ws); // to get 2d array pass 2nd parameter as object {header: 1}
                    this.fileText = text;
                } catch (err: any) {
                    this.fileUploadErr = err;
                }
                this.fileLoading = false;
                if (event && event.target) {
                    event.target.value = '';
                }
            } else {
                this.fileUploadErr = 'no file content';
            }

        }
        fileReader.onerror = (event) => {
            // console.log('error reading file', event);
            this.fileLoading = false;
            this.fileUploadErr = 'error in reading file';
            this.forceBindChanges();
        };
        fileReader.readAsBinaryString(file);
    }

    cleanText(text: string) {
        return text.replace(/\t/g, '')
            .replace(/\n +/g, '\n')
            .replace(/\n+/g, '\n')
            .replace(/ +/g, ' ');
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
        if (this.chatGptRequestInProgress) {
            this.fileSubmitErr = 'please wait while current task finish';
            return;
        }
        // if (this.fileText.length > this.chatMaxLength) {
        //     this.fileSubmitErr = 'currently we support max text length of ' + this.chatMaxLength;
        //     return;
        // }
        this.sendFileSubmitAnalytics();
        this.resetFileUploadItems();
        this.resetFileUploadLastConversation();

        this.chatGptRequestInProgress = true;
        this.fileSubmitInProgress = true;
        this.uploadPromptResultsExpend = true;

        // this.chatGptRequestError = false;
        // this.fileChatShowStopButton = false;
        // this.fileSubmitErr = '';
        // this.fileUploadResults = '';

        let maxLength = this.chatMaxLength;
        if (this.isHebText(this.fileText)) {
            maxLength = this.chatMaxLengthHe;
        }
        this.fileUploadGptHtmlProgress = 0;
        const before_text = this.fileTask + ':\n';
        console.log('splitStringToChunks submitFileUpload')
        this.fileUploadGptHtmlSplitChunks = this.splitStringToChunks(this.fileText, maxLength, before_text)
        this.fileUploadGptHtmlTotalChunks = this.fileUploadGptHtmlSplitChunks.length;
        if (this.fileUploadGptHtmlSplitChunks.length) {
            const item = this.fileUploadGptHtmlSplitChunks[0];
            const fullText = item.before_text + item.text + item.after_text;
            const message = 'please be patient while we are working on your file';
            this.fileUploadResults = message;
            if (this.fileUploadGptHtmlSplitChunks.length > 1) {
                // this.fileUploadGptHtmlSplitResults.push(item.before_text);
            }
            this.fileUploadGptHtmlSplitChunks.shift();
            this.fileUploadProcessPromptChunks(fullText)
        } else {
            this.resetFileUploadItems();
            this.forceBindChanges();
        }
        // const prompt = this.fileTask + ':\n\n' + this.fileText;
        // console.log('prompt', prompt)
        setTimeout(() => {
            this.fileResultsScrollToBottom(true);
        }, 200);
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
        this.chatGptCurrentMessage = msg;
        console.log('sending msg from file upload ', msg.length)
        this.chromeExtensionService.sendMessageToChatGpt(msg, this.fileChatGptConversationId, this.fileChatGptLastMessageId);
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
                // console.log('res.answer.done', res.answer.done)
                if (this.fileSubmitInProgress) {
                    this.handleDoneChatGptFileChunkRequest();
                } else {
                    this.handleDoneChatGptChunkRequest();
                }
                this.forceBindChanges();
                return;
            }
            else if (res.answer) {
                this.handleChatGptResponse(res);
            } else {
                console.log('ListenToChatGpt something went wrong msg', res)
                this.resetItems('something went wrong');
                this.forceBindChanges();
            }
        })
    }

    handleChatGptResponse(res: any) {
        if (res.answer.err) {
            this.handleOnErrorChatGptResponse(res);
        } else if (res.answer.text.trim() !== this.chatGptCurrentMessage.trim()) {
            this.handleOnSuccessChatGptResponse(res);
        } else {
            console.log('ListenToChatGpt something went wrong res.answer', res)
            // this.resetItems('something went wrong res.answer');
            // return;
        }
        this.forceBindChanges();
    }

    handleOnErrorChatGptResponse(res: any) {
        console.log('handleOnErrorChatGptResponse this.fileSubmitInProgress', this.fileSubmitInProgress)
        if (this.fileSubmitInProgress) {
            if (res.answer.errMessage === 'Aborted.') {
                this.resetFileUploadItems();
                if (!this.fileUploadResults || this.fileUploadResults === 'please be patient while we are working on your file') {
                    this.fileUploadResults = res.answer.errMessage;
                    this.chatGptRequestError = true;
                }
            } else {
                this.resetFileUploadItems(res.answer.errMessage);
                this.chatGptRequestError = true;
            }
            if (res.answer.errMessage === 'Unauthorized') {
                this.chatGptNeedToRefreshToken = true;
            }
        } else {
            console.log('ListenToChatGpt msg', res)
            this.changePage('chat');
            if (res.answer.errMessage === 'Aborted.') {
                this.resetItems();
                if (this.chat[this.chat.length - 1] && !this.chat[this.chat.length - 1].text) {
                    this.chat[this.chat.length - 1].text = res.answer.errMessage;
                    this.chatGptRequestError = true;
                }
                this.chat[this.chat.length - 1].done = true;
            } else {
                this.resetItems(res.answer.errMessage);
                this.chatGptRequestError = true;
            }
            // this.resetChatChunksData();
            if (res.answer.errMessage === 'Unauthorized') {
                this.chatGptNeedToRefreshToken = true;
            }
        }
    }

    handleOnSuccessChatGptResponse(res: any) {
        if (this.fileSubmitInProgress) {
            this.chatGptCurrentResult = res.answer.text;
            let conversation_id = '';
            let message_id = '';
            if (res.answer.data) {
                conversation_id = res.answer.data.conversation_id;
                message_id = res.answer.data.message.id;
            }
            if (conversation_id) {
                this.fileChatGptConversationId = conversation_id;
            }
            if (message_id) {
                this.fileChatGptLastMessageId = message_id;
            }
            if (!this.fileUploadGptHtmlSplitChunks.length && !this.fileUploadGptHtmlSplitResults.length) {
                this.fileUploadResults = this.chatGptCurrentResult;
                this.fileResultsScrollToBottom();
            }
            this.fileChatShowStopButton = true;
        } else {
            if (this.chat[this.chat.length - 1] && this.chat[this.chat.length - 1].text !== undefined) {
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
                if (!this.gotFirstAnswerFromChat) {
                    // this.chatPrompt = '';
                    this.gotFirstAnswerFromChat = true;
                    this.chatShowStopButton = true;
                }
                if (!this.chatGptHtmlSplitChunks.length && !this.chatGptHtmlSplitResults.length) {
                    this.chat[this.chat.length - 1].text = this.chatGptCurrentResult;
                    this.sentQuestionToChat = false
                }
                // this.chatGptCurrentMessage = '';
                this.scrollToBottom();
            }
        }
    }

    resetChatLastConversation() {
        this.chatGptLastMessageId = ''
        this.chatGptConversationId = ''
    }

    resetFileUploadLastConversation() {
        this.fileChatGptLastMessageId = ''
        this.fileChatGptConversationId = ''
    }

    resetFileUploadItems(text: string = '') {
        console.log('resetFileUploadItems', text)
        this.chatGptRequestError = false;
        this.fileChatShowStopButton = false;
        this.fileSubmitErr = '';
        if (text) {
            this.fileUploadResults = text;
        }
        this.fileUploadGptHtmlSplitChunks = [];
        this.fileUploadGptHtmlTotalChunks = -1;
        this.fileUploadGptHtmlProgress = -1;
        this.fileSubmitInProgress = false;
        this.chatGptRequestInProgress = false;
        this.forceBindChanges();
    }

    handleDoneChatGptChunkRequest() {
        console.log('this.chatGptHtmlSplitChunks', this.chatGptHtmlSplitChunks)
        console.log('this.chatGptHtmlSplitResults', this.chatGptHtmlSplitResults)
        let result_length = 0
        if (this.chatGptHtmlSplitResults.length) {
            // result_length = 1;
        }
        if (this.chatGptHtmlProgress > -1) {
            this.chatGptHtmlProgress = 100 - Math.ceil(this.chatGptHtmlSplitChunks.length / (this.chatGptHtmlTotalChunks + result_length) * 100);
        }
        console.log('this.chatGptHtmlProgress', this.chatGptHtmlProgress)

        if (this.chatGptHtmlSplitChunks.length) {
            // this.chatGptHtmlSplitResults.push(this.chatGptCurrentResult)
            const item = this.chatGptHtmlSplitChunks[0];
            console.log('item', item)
            const fullText = item.before_text + item.text + item.after_text;
            console.log('fullText.length', fullText.length)
            this.chatGptHtmlSplitChunks.shift();
            setTimeout(() => {
                this.chatProcessPromptChunks('', fullText)
            }, 1000)
        } else if (this.chatGptHtmlSplitResults.length) {
            // const final_text = this.chatGptHtmlSplitResults.join('\n')
            // this.chatGptHtmlSplitResults = [];
            // console.log('final_text', final_text)
            // console.log('final_text.length', final_text.length)
            // const t = 'combine the summarized sections to get a fully detailed summary';
            // this.chatProcessPromptChunks('', t, true)
        } else {
            if (this.chatGptHtmlProgress > -1) {
                this.chatGptHtmlProgress = 100;
            }
            const msg = this.chromeExtensionService.genTitleMessage(this.chatGptConversationId, this.chatGptLastMessageId);
            this.chromeExtensionService.generalSendMessageToChatGpt('chatGptGenTitle', msg);
            if (this.chat[this.chat.length - 1]) {
                this.chat[this.chat.length - 1].done = true;
            }
            this.resetItems();
            setTimeout(() => {
                this.chatGptHtmlProgress = -1;
                this.chatGptHtmlTotalChunks = -1;
            })
        }
    }

    handleDoneChatGptFileChunkRequest() {
        console.log('this.fileUploadGptHtmlSplitChunks', this.fileUploadGptHtmlSplitChunks)
        console.log('this.fileUploadGptHtmlSplitResults', this.fileUploadGptHtmlSplitResults)
        console.log('this.fileUploadGptHtmlProgress', this.fileUploadGptHtmlProgress)
        let result_length = 0
        if (this.fileUploadGptHtmlSplitResults.length) {
            // result_length = 1;
        }
        if (this.fileUploadGptHtmlProgress > -1) {
            this.fileUploadGptHtmlProgress = 100 - Math.ceil(this.fileUploadGptHtmlSplitChunks.length / (this.fileUploadGptHtmlTotalChunks + result_length) * 100);
        }
        if (this.fileUploadGptHtmlSplitChunks.length) {
            // this.fileUploadGptHtmlSplitResults.push(this.chatGptCurrentResult)
            const item = this.fileUploadGptHtmlSplitChunks[0];
            const fullText = item.before_text + item.text + item.after_text;
            this.fileUploadGptHtmlSplitChunks.shift();
            setTimeout(() => {
                this.fileUploadProcessPromptChunks(fullText)
            }, 1000);
        } else if (this.fileUploadGptHtmlSplitResults.length) {
            // const final_text = this.fileUploadGptHtmlSplitResults.join('\n')
            // this.fileUploadGptHtmlSplitResults = [];
            // this.fileUploadProcessPromptChunks(final_text, true)
        } else {
            this.chatGptHtmlProgress = 100;
            const msg = this.chromeExtensionService.genTitleMessage(this.fileChatGptConversationId, this.fileChatGptLastMessageId);
            this.chromeExtensionService.generalSendMessageToChatGpt('chatGptGenTitle', msg)
            this.resetFileUploadItems();
            this.uploadPromptResultsExpend = true;
            this.forceBindChanges();
            setTimeout(() => {
                this.fileUploadGptHtmlProgress = -1;
                this.fileUploadGptHtmlTotalChunks = -1;
            })
        }
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
    async saveCurrentFileUploadResults(type = 'txt') {
        const link = document.createElement("a");
        const options = {type: "text/plain;charset=utf-8"}
        let ext = 'txt';
        let blob;
        let results = this.fileUploadResults;
        if  (this.fileSaveMap[type]) {
            options.type = this.fileSaveMap[type].type;
            ext = type;
            if (ext === 'pdf') {
                const doc = new jsPDF();
                var splitTitle = doc.splitTextToSize(results, 196);
                doc.text(splitTitle, 6, 10);
                results = doc.output();
            } else if (ext === 'docx') {
                const doc = new Document({
                    sections: [
                        {
                            properties: {},
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun(results),
                                    ],
                                }),
                            ],
                        },
                    ],
                });
                blob = await Packer.toBlob(doc)
            }
        }
        var file = new Blob([results],options);
        if (blob) {
            file = blob;
        }
        link.href = URL.createObjectURL(file);
        link.download = "results." + ext;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    resetItems(text: string = '') {
        this.chatGptCurrentMessage = '';
        this.chatGptRequestInProgress = false;
        this.sentQuestionToChat = false;
        this.chatShowStopButton = false;
        this.chatGptHtmlSplitChunks = [];
        this.chatGptHtmlTotalChunks = -1;
        this.chatGptHtmlProgress = -1;
        this.chatGptRequestError = false;
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

    sendChatAnalytics(text: string, type: string) {
        this.chromeExtensionService.sendAnalytics('chat', type, {
            user_email: this.config.user?.email,
            server_url: this.config.server_url,
            text: text.substring(0, 100)
        });
    }
    sendFileSubmitAnalytics() {
        this.chromeExtensionService.sendAnalytics('file-submit', 'submit-file-upload', {
            user_email: this.config.user?.email,
            task: this.fileTask,
            file_type: this.fileType,
            file_name: this.fileName,
            file_text: this.fileText.substring(0, 100)
        });
    }

    stopStream() {
        this.chromeExtensionService.chatGptStopStream();
    }

    stopChat() {
        this.stopStream();
    }

    ngOnDestroy(): void {
        this.privacyModelListener.unsubscribe();
        this.messagesService.ClearEvent('change-main-page');
        for (let item of this.subscriptions) {
            item.unsubscribe()
        }
    }
}
