import { Injectable } from '@angular/core';
import {Observable, ReplaySubject, Subject} from "rxjs";
import {Config} from "../config";
import {Router} from "@angular/router";
import {MyRouter} from "../components/my.router";

@Injectable({
    providedIn: 'root'
})
export class ChromeExtensionService {

    public replay = new ReplaySubject<any>();
    public events: EventsHashTable<Subject<any>> = {};
    private requestTypeLoginRequiredMap: any = {
        'privacy-model': true,
        'chat': true
    }
    private _listenToMessages: Subject<any> = new Subject<any>();
    private listenersMap: any = {};
    private chromeRuntimeListener: any;
    private lastChatGptId: string;
    private chatGptPort: any
    private chatGptListener: any
    private chatGptLastMessageId: string;
    private chatGptLastParentId: string;
    constructor(
        private config: Config,
        // private router: MyRouter
    ) {
        this.setUpChromeRuntimeListener()
        this.setUpChatGptPortListener()
    }

    setUpChromeRuntimeListener() {
        this.chromeRuntimeListener = (request: any, sender: any, sendResponse: any) => {
            console.log('got from content script request for ', request)
            if (request.type) {
                if (request.type in this.requestTypeLoginRequiredMap && this.requestTypeLoginRequiredMap[request.type]) {
                    // need to check login user
                    if (!this.config.user) {
                        this.sendMessageToContentScript('show-sidebar', {})
                        sendResponse({success: false, message: 'user not authorized', request: request})
                        return;
                    }
                }
                if (request.type === 'init-from-content-script') {
                    if (request.host) {
                        this.config.server_host = request.host
                    }
                    sendResponse({success: true, message: 'init from content script', request: request})
                } else {
                    if (this.events[request.type]) {
                        this.Broadcast(request.type, {
                            request: request,
                            sender: sender,
                            sendResponse: sendResponse,
                        })
                    } else {
                        sendResponse({success: false, message: 'no listeners for request type', request: request})
                        // maybe we want to force prompt when there is no listeners
                        // sendResponse({success: false, message: 'force-prompt', request: request})
                    }
                    // this.listenToMessages.next({
                    //     request: request,
                    //     sender: sender,
                    //     sendResponse: sendResponse,
                    // });
                }
            } else {
                sendResponse({success: false, message: 'no request type', request: request})
            }
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

    createMessage(message: string, conversation_id = '', last_message_id = '') {
        if (!this.chatGptLastParentId) {
            this.chatGptLastParentId = this.uuidv4();
        }
        if (this.chatGptLastMessageId) {
            this.chatGptLastParentId = this.chatGptLastMessageId;
        }
        if (last_message_id) {
            this.chatGptLastParentId = last_message_id;
        }
        this.chatGptLastMessageId = this.uuidv4();
        const o: any = {
            action: "next",
            messages: [{
                id: this.chatGptLastMessageId,
                role: "user",
                content: {
                    content_type: "text",
                    parts: [message]
                }
            }],
            model: "text-davinci-002-render-sha",
            parent_message_id: this.chatGptLastParentId
        }
        if (conversation_id) {
            o.conversation_id = conversation_id;
        }
        return o;
    }

    genTitleMessage(conversation_id = '', last_message_id = '') {
        return {
            conversation_id: conversation_id,
            message_id: last_message_id,
            model: "text-davinci-002-render-sha",
        }
    }

    genModerationsMessage(conversation_id = '', input = '') {
        return {
            input: input,
            conversation_id: conversation_id,
            message_id: this.chatGptLastMessageId,
        }
    }

    setUpChatGptPortListener() {
        if (chrome.runtime) {
            this.chatGptListener = (request: any) => {
                if (this.events[request.type]) {
                    this.Broadcast(request.type, request)
                }
                // if (msg.data.done) {
                //     return;
                // }
                // if (msg.data) {
                //     if (msg.data === 'Unauthorized') {
                //         console.log('trySendingMessageToPort Unauthorized msg', msg)
                //     } else {
                //         console.log('trySendingMessageToPort msg', msg)
                //     }
                // }
                // if (msg.question === "Who's there?")
                //   port.postMessage({answer: "Madame"});
                // else if (msg.question === "Madame who?")
                //   port.postMessage({answer: "Madame... Bovary"});
            }
            this.chatGptPort = chrome.runtime.connect({name: "chatGptPort"});
            this.chatGptPort.onMessage.addListener(this.chatGptListener);
        }
    }

    removeChatGptListener() {
        this.chatGptPort.onMessage.removeListener(this.chatGptListener);
    }

    sendMessageToChatGpt(message: string, conversation_id = '', last_message_id = '') {
        if (this.chatGptPort) {
            this.chatGptPort.postMessage({type: 'chatGptRequest', payload: this.createMessage(message, conversation_id, last_message_id)});
        }
    }

    generalSendMessageToChatGpt(type: string, obj: any) {
        if (this.chatGptPort) {
            this.chatGptPort.postMessage({type: type, ...obj});
        }
    }

    refreshGptToken() {
        if (this.chatGptPort) {
            this.chatGptPort.postMessage({type: 'chatGptRefreshToken'});
        }
    }

    listenToContentScriptMessages() {
        if (chrome.runtime) {
            console.log('listenToChromeExtMessages')
            chrome.runtime.onMessage.addListener(this.chromeRuntimeListener)
        }
    }

    removeListenToContentScriptMessages() {
        if (chrome.runtime) {
            console.log('removeListenToContentScriptMessages')
            chrome.runtime.onMessage.removeListener(this.chromeRuntimeListener)
        }
    }

    get listenToMessages(): Subject<any> {
        return this._listenToMessages;
    }

    set listenToMessages(value: Subject<any>) {
        this._listenToMessages = value;
    }

    listenToMessagesMap(type: string): Subject<any> {
        if (!this.listenersMap[type]) {
            this.listenersMap[type] = new Subject<any>();
        }
        return this.listenersMap[type];
    }
    removeFromMessagesMap(type: string): void {
        delete this.listenersMap[type];
    }

    sendExtensionMessage(type: string, obj: any) {
        return new Promise((resolve, reject) => {
            try {
                chrome.runtime.sendMessage({type: type, ...obj}, (response) => {
                    console.log('content script got the message', response)
                    resolve(response);
                });
            } catch (err) {
                reject(err);
            }
        })
    }

    async sendMessageToContentScript(type: string, obj: any) {
        return new Promise((resolve, reject) => {
            try {
                chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
                    if (tabs && tabs.length && tabs[0].id) {
                        console.log('sending message to contet script', type)
                        chrome.tabs.sendMessage(tabs[0].id, {type: type, response: obj}, (response) => {
                            console.log('content script got the message - ' + type, response)
                            resolve(response);
                        })
                    } else {
                        reject('no tabs')
                    }
                })
            } catch (err)  {
                reject(err);
            }
        });
    }

    sendMessageToContentScriptConnect() {
        return new Promise((resolve, reject) => {
            try {
                chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
                    if (tabs && tabs.length && tabs[0].id) {
                        const port = chrome.tabs.connect(tabs[0].id, {name: "channelName"});
                        port.postMessage({url: tabs[0].url});
                        resolve('')
                    } else {
                        reject('no tabs')
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    showSidebar(from: string) {
        console.log('show sidebar request sent - ' + from)
        if (chrome.tabs) {
            this.sendMessageToContentScript('show-sidebar', {})
        }
    }
    hideSidebar() {
        if (chrome.tabs) {
            this.sendMessageToContentScript('hide-sidebar', {})
        }
    }

    getCompanyApiKey() {
        return new Promise((resolve, reject) => {
            if (chrome.storage) {
                chrome.storage.managed.get('api_key', function (data) {
                    const API_KEY = data.api_key;
                    resolve(API_KEY)
                });
            }
            reject()
        });
    }

    /**
     * Broadcast - emmit specific event changes
     * param {string} eventName
     * param {any} payload
     * return void;
     */
    public Broadcast(eventName: string, payload?: any): void {
        const event: Subject<any> = this.events[eventName];
        if (event !== null && typeof event !== 'undefined') {
            event.next(payload);
        }
    }

    /**
     * Start to Listen for a choosing event by adding to a list of interesting events
     * param {string} eventName
     * return {Observable} Observable;
     */
    public ListenFor(eventName: string): Observable<any> {
        let event: Subject<any> = this.events[eventName];
        if (event === null || typeof event === 'undefined') {
            event = new Subject<any>();
            this.events[eventName] = event;
        }
        return event.asObservable();
    }

    /**
     * Stop Listening for a choosing event
     * param {string} eventName
     * return {Observable} Observable;
     */
    public ClearEvent(eventName: string): void {
        delete this.events[eventName];
    }

    /**
     * Unsubscribe all events listening - memory perspective
     * return void;
     */
    public ClearAllEvents() {
        for (const name in this.events) {
            this.events[name].unsubscribe();
            delete this.events[name];
        }
    }

    // setupListenerToPrivacyModel() {
    //     this.ListenFor("privacy-model").subscribe((obj) => {
    //         console.log('privacy-model request')
    //         // if (this.router.url !== '/') {
    //         //     this.router.navigate(['/'])
    //         // }
    //         setTimeout(() => {
    //             this.replay.next(obj)
    //         }, 1000)
    //         obj.sendResponse({success: true})
    //     })
    //     return this.replay;
    // }
    test() {
        const s = new ReplaySubject<any>();
        s.subscribe((res) => {
            console.log('s1', res);
        })
        s.next('test')
        s.subscribe((res) => {
            console.log('s2', res);
        })
    }
}

interface EventsHashTable<T> {
    [key: string]: T;
}
