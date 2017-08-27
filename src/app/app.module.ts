import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {NgModule} from '@angular/core';


import {AngularFireModule} from 'angularfire2';
import {AngularFireDatabaseModule} from 'angularfire2/database';
import {AngularFireAuthModule} from 'angularfire2/auth';

import {
  MdButtonModule,
  MdCheckboxModule,
  MdDatepickerModule,
  MdDialogModule,
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
import {OverviewComponent} from './overview/overview.component';
import {Store} from "./store/store.service";


export const firebaseConfig = {
			apiKey: 'AIzaSyAc4lRwOrVEX7F9vU03KUImmL6_RV45-Ck',
      authDomain: 'parkingtool-6cf77.firebaseapp.com',
      databaseURL: 'https://parkingtool-6cf77.firebaseio.com',
      projectId: 'parkingtool-6cf77',
      storageBucket: 'parkingtool-6cf77.appspot.com',
      messagingSenderId: '506320863480'
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
		OverviewComponent,
  ],
  imports: [
    BrowserModule,
		FormsModule,
    HttpModule,
		NoopAnimationsModule,
		MdButtonModule,
		MdTabsModule,
		MdDialogModule,
    MdDatepickerModule,
    MdNativeDateModule,
    MdSelectModule,
    MdCheckboxModule,
		AngularFireModule.initializeApp(firebaseConfig),
		AngularFireDatabaseModule,
		AngularFireAuthModule
  ],
  providers: [AppComponent, Store],
  bootstrap: [AppComponent, DialogComponent, AdminDialogComponent, LoginComponent, BuchungenComponent]
})

export class AppModule { }
