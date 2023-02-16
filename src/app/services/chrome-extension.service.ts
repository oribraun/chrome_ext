import { Injectable } from '@angular/core';
import {Subject} from "rxjs";
import {Config} from "../config";

@Injectable({
    providedIn: 'root'
})
export class ChromeExtensionService {

    private requestTypeLoginRequiredMap: any = {
        'privacy-model': true
    }
    private _listenToMessages: Subject<any> = new Subject<any>();
    constructor(
        private config: Config
    ) {
        this.listenToContentScriptMessages();
    }

    listenToContentScriptMessages() {
        if (chrome.runtime) {
            console.log('listenToChromeExtMessages')
            chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
                console.log('got from content script request for ', request)
                if (request.type) {
                    if (request.type in this.requestTypeLoginRequiredMap && this.requestTypeLoginRequiredMap[request.type]) {
                        // need to check login user
                        if (!this.config.user) {
                            this.sendMessageToContentScript('toggle-sidebar', {})
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
                        this.listenToMessages.next({
                            request: request,
                            sender: sender,
                            sendResponse: sendResponse,
                        });
                    }
                } else {
                    sendResponse({success: false, message: 'no request type', request: request})
                }
            })
        }
    }

    get listenToMessages(): Subject<any> {
        return this._listenToMessages;
    }

    set listenToMessages(value: Subject<any>) {
        this._listenToMessages = value;
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

    showSidebar() {
        if (chrome.tabs) {
            this.sendMessageToContentScript('show-sidebar', {})
        }
    }
    hideSidebar() {
        if (chrome.tabs) {
            this.sendMessageToContentScript('hide-sidebar', {})
        }
    }
}
