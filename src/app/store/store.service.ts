import {Injectable} from '@angular/core';
import {Vermieter} from '../auswertung/vermieter';

@Injectable()
export class Store {
  public user;
  public emailToRole;

  constructor() {
    this.user = {uid: 'abc123', parkId: 11};
  }

  get vermieter(): boolean {
    // return this.user.parkId && this.user.parkId > 0;
    return false;
  }

  get mieter(): boolean {
    return !this.vermieter;
  }

  setEmailToRole(snapshot: any) {
    this.emailToRole=snapshot;
  }

  getEmailToRole(): any {    
    return this.emailToRole;
  }

  getEmailToUid(uid: string): string {
    //Durchsucht die email2Role-Daten nach der übergebenen Uid und gibt die zugehörige Email zurück
    var e2rKeys = Object.keys(this.emailToRole);
    for (var ek in e2rKeys) {      
      if (this.emailToRole[e2rKeys[ek]].uid == uid) return e2rKeys[ek].replace(/!/g, '.');      
    }
    return null;
  }

  getAlleVermieter(): Vermieter[] {
    var vermieter=[];
    var e2rKeys = Object.keys(this.emailToRole);
    for (var ek in e2rKeys) {      
      if (this.emailToRole[e2rKeys[ek]].parkId > 0) {
        vermieter.push( new Vermieter(this.emailToRole[e2rKeys[ek]].uid, e2rKeys[ek].replace(/!/g,'.')) );
      }
    }
    return vermieter;
  }

  getPidToUid(uid: string): string {    
    var e2rKeys = Object.keys(this.emailToRole);
    for (var ek in e2rKeys) {      
      if (this.emailToRole[e2rKeys[ek]].uid == uid) return this.emailToRole[e2rKeys[ek]].parkId;
    }
    return null;
  }


}