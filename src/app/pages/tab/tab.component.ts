import { Component } from '@angular/core';
import { BaseAbstract } from '@core/abstract/base.abstract';
import {Router} from "@angular/router";

@Component({
    selector: 'app-tab',
    templateUrl: './tab.component.html',
    styleUrls: ['./tab.component.less']
})
export class TabComponent extends BaseAbstract {
    constructor(
        router: Router
    ) {
        super(router);
    }
}
