import {AfterViewChecked, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import * as moment from 'moment';

import * as firebase from 'firebase/app';
import {Store} from '../store/store.service';
import {MdDialog, MdSnackBar} from '@angular/material';
import {ParkConst} from '../util/const';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';

enum ParkState {
  GREEN, RED, YELLOW, GRAY, BLUE
}

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'],
})

export class OverviewComponent implements OnInit, OnDestroy, AfterViewChecked {
  day;
  weekCount = 4;
  woche_von_bis: string;
  weeks;
  mietDay;
  year;
  JSON: JSON;

  changeMail;

  private ref;
  private query;

  ngOnDestroy(): void {
    this.query.off();
  }

  constructor(public store: Store, private snachBar: MdSnackBar, private dialog: MdDialog,
              private changeDetector: ChangeDetectorRef, private ngZone: NgZone) {
    this.JSON = JSON;
  }

  calcValues() {
    if (this.query) {
      this.query.off();
    }

    const kw = this.day.week();
    const kwTo = this.day.clone().add(3, 'weeks').week();

    this.weeks = this.calcMoreWeekDays(kw, this.weekCount);

    const firstDay = this.weeks[0][0];

    this.year = firstDay.year;
    this.woche_von_bis = 'KW' + kw + ' - KW' + kwTo + ' ' + this.year;
    const lastWeek = this.weeks[this.weeks.length - 1];
    const lastDay = lastWeek[lastWeek.length - 1];

    let lastDayValue = lastDay.dayOfYear;
    if (lastDay.year > this.year) {
      lastDayValue = 366;
    }
    let firstDayValue = firstDay.dayOfYear;
    if (firstDay.year < this.year) {
      firstDayValue = 1;
    }

    this.ref = firebase.database().ref(ParkConst.BUCHUNGEN_PFAD);
    this.query = this.ref.child(this.year).orderByKey().startAt(String(firstDayValue)).endAt(String(lastDayValue));
    this.query.on('value', (snapshot) => {
        const value = snapshot.val();

        this.weeks.forEach(week => {
          week.forEach(entry => {
            entry.free = null;
            entry.pId = null;

            const day = entry.dayOfYear;
            let state = entry.year !== this.year ? ParkState.GRAY : this.store.vermieter ? ParkState.GREEN : ParkState.RED;
            if (state === 0) {
              entry.pId = this.store.oververviewUser.parkId;
            }

            if (value) {
              const dayValue = value[day];
              if (dayValue) {
                const dayValues = Object.keys(dayValue).map(k => {
                  const ret = dayValue[k];
                  ret.key = k;
                  return ret;
                });
                const vermieter = this.store.vermieter;
                if (vermieter) {
                  const vValues = dayValues.filter(v => v.vId === this.store.oververviewUser.uid);
                  if (vValues.length > 0) {
                    const vValue = vValues[0];
                    entry.key = vValue.key;
                    state = vValue.mId == null ? ParkState.YELLOW : ParkState.RED;
                    if (state === 1) {
                      const mValues = dayValues.filter(v => v.mId === this.store.oververviewUser.uid);
                      if (mValues.length > 0) {
                        const mValue = mValues[0];
                        entry.key = mValue.key;
                        entry.pId = mValue.pId;
                        state = ParkState.BLUE;
                      }
                    }
                  }
                }
                if (!vermieter) {
                  state = entry.year !== this.year ? ParkState.GRAY : ParkState.RED;
                  entry.pId = null;
                  if (dayValues.length > 0) {
                    const mValues = dayValues.filter(v => v.mId === this.store.oververviewUser.uid);
                    if (mValues.length > 0) {
                      const mValue = mValues[0];
                      entry.key = mValue.key;
                      entry.pId = mValue.pId;
                      state = ParkState.GREEN;
                    } else {
                      const freeValues = dayValues.filter(v => v.mId == null);
                      if (freeValues.length > 0) {
                        state = ParkState.YELLOW;
                        entry.free = freeValues.length;
                      }
                    }
                  }
                }
              }
            }
            if (state != null) {
              entry.state = state;
            }
          });
        });
        this.changeDetector.detectChanges();
      }
    );
  }

  parkplatzColor(state: ParkState) {
    return state != null ? ParkState[state].toString().toLowerCase() : '';
  }

  calcMoreWeekDays(week, weeks) {
    const ret = [];

    for (let i = 0; i < weeks; i++) {
      ret.push(this.calcWeekDays(week + i));
    }
    return ret;
  }

  calcWeekDays(week) {
    const ret = [];

    const firstDayInWeek = moment();
    firstDayInWeek.year(this.day.year());
    firstDayInWeek.week(week);
    for (let i = 1; i <= 5; i++) {
      const weekDay = firstDayInWeek.day(i);
      ret.push({year: weekDay.year(), dayOfYear: weekDay.dayOfYear()});
    }
    return ret;
  }

  ngOnInit() {
    this.day = moment();
    this.calcValues();
  }

  vermieterIsMieter(day): boolean {
    const now = moment();
    const clickDay = this.getDayBorder(day);
    const clickDayM2 = clickDay.clone().subtract(2, 'days');
    return day.state === 1 && now.isAfter(clickDayM2);
  }

  dayClick(day) {
    console.log('dayClick(' + day + ')');
    const border = this.getDayBorder(day);

    const now = moment();
    if (now.isAfter(border)) {
      this.snachBar.open('Die Bearbeitung ist für diesen Tag gesperrt', null, {duration: 2000});
      return;
    }

    const dayRef = this.ref.child(day.year).child(day.dayOfYear);

    const vermieter = this.store.vermieter;
    if (vermieter) {
      // Test mit enum - wie?
      if (day.state === 0) {
        dayRef.push({vId: this.store.oververviewUser.uid, pId: this.store.oververviewUser.parkId});
      } else if (day.state === 1) {

        // PROBLEM: BEI DER STORNOFRIST HANDELT ES SICH UM ARBEITS-, NICHT WOCHENTAGE! Daher prüfen:
        // Sind unter den Tagen der (nun leider ja variablen) Frist Wochendend-Tage (5||6),
        // falls ja: Frist verlängern.
        let daysToSubtract = this.store.config['tagesfrist'];
        console.log('Geklickter Tag:' + border.format('DD.MM.YYYY') + ' (' + border.weekday() + ')');
        for (let i = 1; i <= daysToSubtract; i++) {
          console.log('Tag -' + i + ' der ' + daysToSubtract + '-Tagesfrist:');
          border.subtract(1, 'days');
          console.log(border.format('DD.MM.YYYY') + ' : ' + border.day());
          if (border.day() === 0) {
            console.log('Tag ist ein Sonntag -> Frist um 1 Tag verlängern!');
            daysToSubtract++;
          }
          if (border.day() === 6) {
            console.log('Tag ist ein Samstag -> Frist um 1 Tag verlängern!');
            daysToSubtract++;
          }
        }
        console.log('Tag, an dem eine Stornierung noch möglich ist: ' + border.format('DD.MM.YYYY'));
        // ------------------------------------------------------------------------------------------

        // border.subtract(2, 'days');
        if (now.isAfter(border)) {
          this.mietDay = day;
          this.snachBar.open('Eine Stornierung ist nicht mehr möglich.', null, {duration: 2000});
        } else {
          this.ngZone.run(() => {
            this.dialog.open(ConfirmDialogComponent).afterClosed().subscribe(result => {
              if (result === 'ok') {
                console.log('res: ' + result);
                dayRef.child(day.key).remove();
                this.changeDetector.detectChanges();
              }
            });
          });
        }
      } else if (day.state === 2) {
        dayRef.child(day.key).remove();
      } else if (day.state === 4) {
        dayRef.child(day.key).child('mId').remove();
      }
    }
    if (!vermieter) {
      // Test mit enum - wie?
      if (day.state === 0) {
        this.ngZone.run(() => {
          this.dialog.open(ConfirmDialogComponent).afterClosed().subscribe(result => {
            if (result === 'ok') {
              console.log('res: ' + result);
              dayRef.child(day.key).child('mId').remove();
            }
          });
        });
      } else if (day.state === 1) {
        this.mietDay = day;
      } else if (day.state === 2) {
        this.mietDay = day;
      }
    }
    this.changeDetector.detectChanges();
  }

  getDayBorder(day) {
    const sperrzeit = this.store.config['sperrzeit'];

    const border = moment();
    const splits = sperrzeit.split(':');
    border.year(day.year);
    border.dayOfYear(day.dayOfYear);
    border.hour(Number(splits[0]));
    border.minute(Number(splits[1]));
    return border;
  }

  chooseSlotClosed() {
    this.mietDay = null;
    this.changeDetector.detectChanges();
  }

  weiter() {
    const year = this.day.year();
    const nextYear = this.day.clone().add(4, 'weeks').year();
    if (nextYear > year) {
      this.day.year(nextYear);
      this.day.week(1);
    } else {
      this.day.add(4, 'weeks');
    }
    this.calcValues();
  }

  zurueck() {
    this.day.subtract(4, 'weeks');
    this.calcValues();
  }

  formatDate(day) {
    return moment().year(day.year).dayOfYear(day.dayOfYear).format('DD.MM.');
  }

  info(day) {
    return day.state !== 1 && day.pId != null ? 'P' + day.pId : day.free != null ? '#' + day.free : '';
  }

  changeUser() {
    let message;
    if (this.changeMail == null || this.changeMail.length === 0) {
      this.changeMail = this.changeMail.toLowerCase();
      message = 'Bitte Mailadresse angeben.';
      this.snachBar.open(message, null, {duration: 2000});
    } else {
      firebase.database().ref('/emailToRole').child(this.changeMail.replace(/\./g, '!')).once('value').then(snapshot => {
        const value = snapshot.val();
        if (value != null) {
          value.email = this.changeMail;
          this.store.ovUser = value;
          //Hier war doch n Dreher oder? -Malte
          message = 'Aktiver Benutzer ist jetzt ' + this.changeMail;
          this.changeMail = null;

          this.calcValues();
        } else {
          message = 'Benutzer ' + this.changeMail + ' nicht gefunden.';
        }
        this.snachBar.open(message, null, {duration: 2000});
      });
    }

  }

  magic() {
    const now = moment();
    this.weeks.forEach(week => {
      week.forEach(entry => {
        const border = this.getDayBorder(entry);
        if (now.isBefore(border)) {
          if (entry.free > 0) {
            const ref = firebase.database().ref(ParkConst.BUCHUNGEN_PFAD).child(entry.year).child(entry.dayOfYear);
            ref.orderByChild('mId')
              .limitToFirst(1).once('value').then(snapshot => {
              const value = snapshot.val();
              const key = Object.keys(value)[0];
              ref.child(key).update({mId: this.store.oververviewUser.uid});
            });
          }
        }
      });
    });
  }

  checkCount = 0;

  ngAfterViewChecked(): void {
    console.log('checked: ' + this.checkCount++);
  }
}
