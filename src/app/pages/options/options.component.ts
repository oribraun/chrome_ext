import { Component, OnInit } from '@angular/core';
import { BaseAbstract } from '@core/abstract/base.abstract';
import { Options, ThemeType } from '@models';
import {Router} from "@angular/router";
import {MyRouter} from "../../components/my.router";

@Component({
    selector: 'app-options',
    templateUrl: './options.component.html',
    styleUrls: ['./options.component.less']
})
export class OptionsComponent extends BaseAbstract implements OnInit {

    public options?: Options;
    public themeType: typeof ThemeType = ThemeType;

    constructor(
        router: MyRouter
    ) {
        super(router);
    }

    ngOnInit(): void {
        this.subs.options = this.optionsService.state$.subscribe({
            next: (options: Options) => {
                this.options = options;
            }
        });
    }

    public selectTheme(theme: ThemeType): void {
        this.optionsService.setTheme(theme);
    }
}
