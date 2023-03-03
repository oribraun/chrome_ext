import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
    disableConsole();
}

platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));

function disableConsole() {
    window.console.log = () => {};
    window.console.assert = () => {};
    window.console.dir = () => {};
    // window.console.error = () => {};
    window.console.info = () => {};
    window.console.time = () => {};
    window.console.timeEnd = () => {};
    window.console.trace = () => {};
    window.console.warn = () => {};
}
