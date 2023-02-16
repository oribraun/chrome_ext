import { Component } from '@angular/core';
import { BaseAbstract } from '@core/abstract/base.abstract';
import {Router} from "@angular/router";

@Component({
    selector: 'app-popup',
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.less']
})
export class PopupComponent extends BaseAbstract {
    constructor(
        router: Router
    ) {
        super(router);
        this.sendMessageToChromeInjectScript();
    }


    private async sendMessageToChromeInjectScript(){
        // const [tab]: any = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        // console.log('asdfasdf', tab)
        // const response = await chrome.tabs.sendMessage(tab.id, {greeting: "hello"});
        // // do something with response here, not outside the function
        // console.log('response',response);

        // chrome.runtime.onMessage.addListener(
        //     function(request, sender, sendResponse) {
        //         console.log('sender', sender)
        //         console.log(sender.tab ?
        //             "from a content script:" + sender.tab.url :
        //             "from the extension");
        //         if (request.greeting === "hello")
        //             sendResponse({farewell: "goodbye"});
        //     }
        // );
    }
}
