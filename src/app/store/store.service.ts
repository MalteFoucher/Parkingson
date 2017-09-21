import {Injectable} from '@angular/core';
import {Vermieter} from '../auswertung/vermieter';

@Injectable()
export class Store {
  public ovUser;
  public eUser;
  public emailToRole;
  public config;
  public projectId;

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

  get benutzerAdmin(): boolean {
    return this.eUser  && this.eUser.benutzerAdmin;
  }

  get buchungsAdmin(): boolean {
    return this.eUser  && this.eUser.buchungsAdmin;
  }

  
  setEmailToRole(snapshot: any) {
    this.emailToRole = snapshot;
  }
  getEmailToRole(): any {
    return this.emailToRole;
  }

  setProjectId(id: string) {
    this.projectId = id;
  }
  getProjectId(): string {
    return this.projectId;
  }

  getEmailToUid(uid: string): string {
    // Durchsucht die email2Role-Daten nach der übergebenen Uid und gibt die zugehörige Email zurück    
    if (uid == "not set yet") {
      return "Fehlerhafte UserID";
    }
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

  updateE2R(key: string, data: any) {
    var dataKeys = Object.keys(data);
    for (var dk in dataKeys) {
      //this.emailToRole[key][dataKeys[dk]] = data[dataKeys[data]];
    }
  }

  deleteFromE2R(key: string) {
    this.emailToRole[key] = {};
  }

  pushToE2R(data: any) {
    this.emailToRole[data.email] = {
      parkId:data.parkId,
      isActive:data.isActive,
      benutzerAdmin: data.benutzerAdmin,
      buchungsAdmin: data.buchungsAdmin,
      uid: data.uid
    };
  }

  getUserId(): string {
    return this.eUser.uid;
  }
}
