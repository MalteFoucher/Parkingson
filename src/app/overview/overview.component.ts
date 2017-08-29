import {Component, OnDestroy, OnInit} from '@angular/core';
import * as moment from 'moment';
import * as firebase from 'firebase/app';
import {Store} from '../store/store.service';

enum ParkState {
  GREEN, RED, YELLOW, GRAY
}

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})

export class OverviewComponent implements OnInit, OnDestroy {
  day;
  weekCount = 4;
  woche_von_bis: string;
  weeks;
  mietDay;
  year;
  JSON: JSON;
  private ref: firebase.database.Reference;
  private query: firebase.database.Query;

  ngOnDestroy(): void {
    this.query.off();
  }

  constructor(public store: Store) {
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

    this.ref = firebase.database().ref('/buchungen3');
    this.query = this.ref.child(this.year).orderByKey().startAt(String(firstDayValue)).endAt(String(lastDayValue));
    this.query.on('value', (snapshot) => {
        const value = snapshot.val();

        console.log('value: ' + JSON.stringify(value));


        this.weeks.forEach(week => {
          week.forEach(entry => {
            const day = entry.dayOfYear;


            let state = entry.year !== this.year ? ParkState.GRAY : this.store.vermieter ? ParkState.GREEN : ParkState.RED;

            if (value) {
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
                  if (dayValues.length > 0) {
                    const mValues = dayValues.filter(v => v.mId === this.store.user.uid);
                    console.log('mValues: ' + JSON.stringify(mValues));
                    if (mValues.length > 0) {
                      entry.key = mValues[0].key;
                      state = ParkState.GREEN;
                    } else {
                      const freeValues = dayValues.filter(v => v.mId == null);
                      console.log('freeValues: ' + JSON.stringify(freeValues));
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

    console.log('week: ' + JSON.stringify(ret));

    return ret;
  }

  ngOnInit() {
    this.day = moment();
    this.calcValues();
  }

  dayClick(day) {
    const dayRef = this.ref.child(day.year).child(day.dayOfYear);

    if (this.store.vermieter) {
      console.log('vermieter');
      // Test mit enum - wie?
      if (day.state === 0) {
        console.log('green');
        dayRef.push({vId: this.store.user.uid, pId: this.store.user.parkId});
      } else if (day.state === 1) {
        console.log('red');
        dayRef.child(day.key).remove();
      } else if (day.state === 2) {
        console.log('yellow');
        dayRef.child(day.key).remove();
      }
    } else {
      console.log('mieter');
      // Test mit enum - wie?
      if (day.state === 0) {
        console.log('green');
        dayRef.child(day.key).child('mId').remove();
      } else if (day.state === 2) {
        console.log('yellow');
        this.mietDay = day;
      }
    }
  }

  chooseSlotClosed() {
    this.mietDay = null;
  }

  weiter() {
    const year = this.day.year();
    const nextYear = this.day.clone().add(4, "weeks").year();
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
}
