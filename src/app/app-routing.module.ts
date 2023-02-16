import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from "./components/login/login.component";
import {AuthGuard} from "./guards/auth.guard";
import {PrivacyModelComponent} from "./components/privacy-model/privacy-model.component";
import {PromptUploaderComponent} from "./components/prompt-uploader/prompt-uploader.component";

const routes: Routes = [
    {
        path: 'popup',
        loadChildren: () => import('./pages/popup/popup.module').then(m => m.PopupModule)
    },
    {
        path: 'tab',
        loadChildren: () => import('./pages/tab/tab.module').then(m => m.TabModule)
    },
    {
        path: 'options',
        loadChildren: () => import('./pages/options/options.module').then(m => m.OptionsModule)
    },
    { path: '', component: PrivacyModelComponent, pathMatch : 'full', canActivate: [AuthGuard] },
    { path: 'prompt-uploader', component: PromptUploaderComponent, pathMatch : 'full', canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent, pathMatch : 'full' },
    { path: 'login/:type', component: LoginComponent, pathMatch : 'full' },
    // { path: 'privacy-model', component: PrivacyModelComponent, pathMatch : 'full', canActivate: [AuthGuard] },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true, relativeLinkResolution: 'legacy' })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
