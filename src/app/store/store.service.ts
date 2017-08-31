import {Injectable} from '@angular/core';
import {Vermieter} from '../auswertung/vermieter';

@Injectable()
export class Store {
  public ovUser;
  public eUser;
  public emailToRole;
  public config;

  constructor() {
    // this.user = {uid: 'abc123', parkId: 11};
  }

  get oververviewUser() {
    const ret = this.ovUser != null ? this.ovUser : this.eUser;
    return ret;
  }

  get vermieter(): boolean {
    const ret = this.oververviewUser.parkId != null && this.oververviewUser.parkId > 0;
    return ret;
  }

  get mieter(): boolean {
    return !this.vermieter;
  }

  setEmailToRole(snapshot: any) {
    this.emailToRole = snapshot;
  }

  getEmailToRole(): any {
    return this.emailToRole;
  }

  getEmailToUid(uid: string): string {
    // Durchsucht die email2Role-Daten nach der übergebenen Uid und gibt die zugehörige Email zurück
    const e2rKeys = Object.keys(this.emailToRole);
    for (const ek in e2rKeys) {
      if (this.emailToRole[e2rKeys[ek]].uid == uid) return e2rKeys[ek].replace(/!/g, '.');
    }
    return null;
  }

  getAlleVermieter(): Vermieter[] {
    const vermieter = [];
    const e2rKeys = Object.keys(this.emailToRole);
    for (const ek in e2rKeys) {
      if (this.emailToRole[e2rKeys[ek]].parkId > 0) {
        vermieter.push(new Vermieter(this.emailToRole[e2rKeys[ek]].uid, e2rKeys[ek].replace(/!/g, '.')));
      }
    }
    return vermieter;
  }

  getPidToUid(uid: string): string {
    const e2rKeys = Object.keys(this.emailToRole);
    for (const ek in e2rKeys) {
      if (this.emailToRole[e2rKeys[ek]].uid === uid) return this.emailToRole[e2rKeys[ek]].parkId;
    }
    return null;
  }

  setConfig(config) {
    this.config = config;
  }
}
