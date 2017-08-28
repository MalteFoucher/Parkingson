import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import * as moment from 'moment';
import * as firebase from 'firebase/app';
import {Store} from '../store/store.service';

enum ParkState {
  GREEN, RED, YELLOW
}

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})

export class OverviewComponent implements OnInit {
  weekCount = 4;

  woche_von_bis: string;
  weeks;
  JSON: JSON;
  private ref: firebase.database.Reference

  constructor(public store: Store) {
    this.JSON = JSON;
    const kw = moment().week();
    this.woche_von_bis = 'KW' + kw + ' - KW' + (kw + (this.weekCount - 1));

    this.weeks = this.calcMoreWeekDays(kw, this.weekCount);

    const firstDay = this.weeks[0][0];
    const lastWeek = this.weeks[this.weeks.length - 1];
    const lastDay = lastWeek[lastWeek.length - 1];

    console.log('firstDay: ' + JSON.stringify(firstDay));
    console.log('lastDay: ' + JSON.stringify(lastDay));
    console.log('call database');
    this.ref = firebase.database().ref('/buchungen3').child(firstDay.year);
    this.ref.orderByKey().startAt(String(firstDay.dayOfYear)).endAt(String(lastDay.dayOfYear)).on('value', (snapshot) => {
        const value = snapshot.val();

        console.log('value: ' + JSON.stringify(value));


        if (value) {
          this.weeks.forEach(week => {
            week.forEach(entry => {
              let state: ParkState = null;

              const day = entry.dayOfYear;

              state = this.store.vermieter ? ParkState.GREEN : ParkState.RED;

              const dayValue = value[day];
              if (dayValue) {
                const dayValues = Object.keys(dayValue).map(k => {
                  const ret = dayValue[k];
                  ret.key = k;
                  return ret;
                });
                if (this.store.vermieter) {
                  const vValues = dayValues.filter(v => v.vId === this.store.user.uid);
                  console.log('vValues: ' + JSON.stringify(vValues));
                  if (vValues.length > 0) {
                    const vValue = vValues[0];
                    entry.key = vValue.key;
                    state = vValue.mId == null ? ParkState.YELLOW : ParkState.RED;
                  }

                } else {
                  const mValues = dayValues.filter(v => v.mId === this.store.user.uid);
                  console.log('mValues: ' + JSON.stringify(mValues));
                  if (mValues.length > 0) {
                    entry.key = mValues[0].key;
                    state = ParkState.GREEN;
                  }
                }
              }

              if (state != null) {
                entry.state = state;
              }
            });
          });
        }
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

    const firstDayInWeek = moment().week(week);
    for (let i = 1; i <= 5; i++) {
      const weekDay = firstDayInWeek.day(i);
      ret.push({year: weekDay.year(), dayOfYear: weekDay.dayOfYear()});
    }

    console.log('week: ' + JSON.stringify(ret));

    return ret;
  }

  ngOnInit() {
  }

  dayClick(day) {
    if (this.store.vermieter) {
      console.log('vermieter');
      // Test mit enum - wie?
      if (day.state === 0) {
        console.log('green');
        this.ref.child(day.dayOfYear).push({vId: this.store.user.uid, pId: this.store.user.parkId});
      }
      if (day.state === 2) {
        console.log('yellow');

        console.log("key: " + day.key);

        this.ref.child(day.dayOfYear).child(day.key).remove();
      }
    }
  }
}
