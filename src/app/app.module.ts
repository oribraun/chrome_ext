import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import {LoginComponent} from "./components/login/login.component";
import {FormsModule} from "@angular/forms";
import {Config} from "./config";
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import { PrivacyModelComponent } from './components/privacy-model/privacy-model.component';
import { PromptUploaderComponent } from './components/prompt-uploader/prompt-uploader.component';
import { HeaderComponent } from './components/header/header.component';
import { MainComponent } from './components/main/main.component';
import {CustomInterceptor} from "./components/custom-interceptor";
import {MyRouter} from "./components/my.router";
import { GoogleSignInDirective } from './directives/google-sign-in.directive';
import { GoogleSigninComponent } from './components/auth/google-signin/google-signin.component';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import {environment} from "@environment";

@NgModule({
    bootstrap: [AppComponent],
    declarations: [
        AppComponent,
        LoginComponent,
        PrivacyModelComponent,
        PromptUploaderComponent,
        HeaderComponent,
        MainComponent,
        GoogleSigninComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        HttpClientModule,
        AppRoutingModule,
        CoreModule,
        AngularFireModule.initializeApp(environment.firebaseConfig),
        AngularFireAuthModule,
    ],
    providers: [
        Config,
        MyRouter,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: CustomInterceptor ,
            multi: true
        }
    ],
})
export class AppModule {}
