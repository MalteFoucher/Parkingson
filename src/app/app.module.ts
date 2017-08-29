import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {NgModule} from '@angular/core';
// Import HttpClientModule from @angular/common/http
import {HttpClientModule} from '@angular/common/http';

import {AngularFireModule} from 'angularfire2';
import {AngularFireDatabaseModule} from 'angularfire2/database';
import {AngularFireAuthModule} from 'angularfire2/auth';

import {
  MdButtonModule,
  MdCheckboxModule,
  MdDatepickerModule,
  MdDialogModule,
  MdInputContainer,
  MdNativeDateModule,
  MdSelectModule,
  MdTabsModule
} from '@angular/material';
import {AppComponent} from './app.component';
import {KalenderComponent} from './kalender.component';
import {DialogComponent} from './dialog/dialog.component';
import {LoginComponent} from './login/login.component';
import {AuswertungComponent} from './auswertung/auswertung.component';
import {AdminDialogComponent} from './admin-dialog/admin-dialog.component';
import {BuchungenComponent} from './buchungen/buchungen.component';
import {TextInputDialogComponent} from './text-input-dialog/text-input-dialog.component';
import {OverviewComponent} from './overview/overview.component';
import {Store} from './store/store.service';
import {ChooseSpotComponent} from './choose-spot/choose-spot.component';


export const firebaseConfig = {
  apiKey: "AIzaSyAc4lRwOrVEX7F9vU03KUImmL6_RV45-Ck",
  authDomain: "parkingtool-6cf77.firebaseapp.com",
  databaseURL: "https://parkingtool-6cf77.firebaseio.com",
  projectId: "parkingtool-6cf77",
  storageBucket: "parkingtool-6cf77.appspot.com",
  messagingSenderId: "506320863480"
};

@NgModule({
  declarations: [
    AppComponent,
    KalenderComponent,
    DialogComponent,
    LoginComponent,
    AuswertungComponent,
    AdminDialogComponent,
    BuchungenComponent,
    TextInputDialogComponent,
    OverviewComponent,
    ChooseSpotComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    HttpClientModule,
    NoopAnimationsModule,
    MdButtonModule,
    MdTabsModule,
    MdDialogModule,
    MdDatepickerModule,
    MdNativeDateModule,
    MdSelectModule,
    MdCheckboxModule,
    MdInputContainer,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule
  ],
  providers: [AppComponent, Store],
  //Warum muss ich meine ganzen selbsgebauten Komponenten eigetlich bootstrappen?
  bootstrap: [AppComponent, DialogComponent, AdminDialogComponent, LoginComponent, BuchungenComponent, TextInputDialogComponent]
})

export class AppModule {
}
