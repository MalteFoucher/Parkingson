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
  private dataRef: firebase.database.Query;

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
    this.dataRef = firebase.database().ref('/buchungen3/' + firstDay.year).orderByKey().startAt(String(firstDay.dayOfYear)).endAt(String(lastDay.dayOfYear));
    this.dataRef.on('value', (snapshot) => {
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
                const dayValues = Object.keys(dayValue).map(k => dayValue[k]);
                if (this.store.vermieter) {
                  const vValues = dayValues.filter(v => v.vId = this.store.user.uid);
                  if (vValues) {
                    state = vValues[0].mId == null ? ParkState.YELLOW : ParkState.RED;
                  }
                } else {
                  const mValues = dayValues.filter(v => v.mId = this.store.user.uid);
                  if (mValues) {
                    state = ParkState.GREEN;
                  }
                }
              }

              console.log('state: ' + state);
              if (state != null) {
                entry.state = state;
              }
              console.log('dayValue: ' + JSON.stringify(entry));
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
}
