import { Injector } from "@angular/core";
import { AppInjector } from "@core/configs/app-injector";
import { OptionsService } from "@core/services/options.service";
import {environment} from "@environment";

export function appInitializerFn(injector: Injector, optionsService: OptionsService) {
    return (): Promise<void> => {
        return new Promise((resolve) => {
            if(!environment.extension) {
                console.log('init app', injector);
            }
            AppInjector.set(injector);
            optionsService.init();
            resolve();
        });
    };
}
