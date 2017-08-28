import {Component, OnInit} from '@angular/core';
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
              const day = entry.dayOfYear;

              entry.state = this.store.vermieter ? ParkState.GREEN : ParkState.RED;

              const dayValue = value[day];
              if (dayValue) {
                console.log('dayValue: ' + JSON.stringify(dayValue));
                const dayValues = Object.keys(dayValue).map(k => dayValue[k]);
                if (this.store.vermieter) {
                  const vValues = dayValues.filter(v => v.vId = this.store.user.uid);
                  if (vValues) {
                    entry.state = vValues[0].mId == null ? ParkState.YELLOW : ParkState.RED;
                  }
                } else {
                  const mValues = dayValues.filter(v => v.mId = this.store.user.uid);
                  if (mValues) {
                    entry.state = ParkState.GREEN;
                  }
                }
              }

              // const abc = Object.values(value[day]).filter(v => v.vId === store.user.uid);

            });
          });
        }
      }
    );
  }

  calcMoreWeekDays(week, weeks) {
    const ret = [];

    for (let i = 0; i < weeks; i++) {
      ret.push(this.calcWeekDays(week + i));
    }

    console.log('all: ' + JSON.stringify(ret));
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
