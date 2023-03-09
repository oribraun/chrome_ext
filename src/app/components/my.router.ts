import {NavigationExtras, Router} from "@angular/router";
import {environment} from "@environment";
import {Injectable} from "@angular/core";
import {MessagesService} from "../services/messages.service";

@Injectable()
export class MyRouter {
    constructor(
        readonly router: Router,
        private messagesService: MessagesService
    ) {
    }
    navigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
        if (environment.extension) {
            // for chrome extension in iframe to prevent adding history pages in domains
            extras = {skipLocationChange: true, ...extras}
            // console.log('extras', extras)
        }
        setTimeout(() => {
            this.messagesService.Broadcast('navigate');
        })
        return this.router.navigate(commands, extras);
    }
    get url() {
        return this.router.url;
    }
}
