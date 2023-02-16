import {Component, OnInit} from '@angular/core';
import {Config} from "./config";
import {ApiService} from "./services/api.service";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
    constructor(
        private config: Config,
        private apiService: ApiService
    ) {}

    ngOnInit(): void {
        setTimeout(() => {
            this.setupCredsFromStorage();
        })
    }



    async setupCredsFromStorage() {
        // if (typeof STATIC_URL !== 'undefined' && STATIC_URL !== "{% static 'client/' %}") {
        //   this.config.staticServerPath = STATIC_URL;
        // }
        // if (typeof USER !== 'undefined' && USER !== 'AnonymousUser' && USER !== '{{ user | safe }}') {
        //     this.config.user = JSON.parse(USER);
        // } else {
        //     this.config.user_subject.next('');
        // }
        // console.log('csrf_token', TOKEN)
        // if (typeof TOKEN !== 'undefined' && TOKEN !== '{{ csrf_token }}') {
        //     this.config.csrf_token = TOKEN;
        // }
        console.log('setupCredsFromStorage')
        const csrftoken = await this.config.getCookie('csrftoken');
        const token = await this.config.getCookie('token');
        const user = await this.config.getCookie('user');
        if (csrftoken) {
            this.config.csrf_token = csrftoken;
        }
        if (token) {
            this.config.token = token;
        }
        if (user) {
            this.config.user = JSON.parse(user);
        } else {
            this.config.user_subject.next('');
        }
    }
}
