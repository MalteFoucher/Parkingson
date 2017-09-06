import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {NgModule} from '@angular/core';

import {HttpClientModule} from '@angular/common/http';

import {
  MdButtonModule,
  MdCheckboxModule,
  MdDatepickerModule,
  MdDialogModule,
  MdGridListModule,
  MdIconModule,
  MdInputModule,
  MdListModule,
  MdNativeDateModule,
  MdSelectModule,
  MdSidenavModule,
  MdSnackBarModule,
  MdTabsModule,
  MdToolbarModule
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
import {VerwaltungComponent} from './verwaltung/verwaltung.component';
import {EmailService} from './email.service';
import {ConfirmDialogComponent} from './confirm-dialog/confirm-dialog.component';
import {AngularFireModule} from 'angularfire2';
import {AngularFireDatabaseModule} from 'angularfire2/database';
import {AngularFireAuthModule} from 'angularfire2/auth';


export const firebaseConfig = {
  apiKey: 'AIzaSyCLHo_GBE6DsfCElOiJaIFsEpehmX9H3sE',
  authDomain: 'parkplatztool.firebaseapp.com',
  databaseURL: 'https://parkplatztool.firebaseio.com',
  projectId: 'parkplatztool',
  storageBucket: 'parkplatztool.appspot.com',
  messagingSenderId: '110161579432'

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
    VerwaltungComponent,
    ConfirmDialogComponent,
  ],
  entryComponents: [DialogComponent, ConfirmDialogComponent, AdminDialogComponent, LoginComponent, BuchungenComponent, TextInputDialogComponent],
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
    MdInputModule,
    MdSnackBarModule,
    MdGridListModule,
    MdToolbarModule,
    MdSidenavModule,
    MdIconModule,
    MdListModule,
    // AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule
  ],
  providers: [AppComponent, Store, EmailService],
  bootstrap: [AppComponent]
})

export class AppModule {
}
