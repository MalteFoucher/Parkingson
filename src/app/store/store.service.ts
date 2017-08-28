import {Injectable} from '@angular/core';

@Injectable()
export class Store {
  public user;

  constructor() {
    this.user = {uid: 'abc123'};
  }

  get vermieter(): boolean {
    // return this.user.parkId && this.user.parkId > 0;
    return false;
  }

  get mieter(): boolean {
    return !this.vermieter;
  }


}
