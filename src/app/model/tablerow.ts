//Klasse, die eine Tabellenzeile repräsentieren soll
import { Buchung } from './buchung';

export class Tablerow {
//werden spter noch auf private und dann mit gettern. Oder müssen die fürs Template public sein?

    public montag = new Buchung('','', null, null, null, null, null);
    public dienstag = new Buchung('','', null, null, null, null, null);
    public mittwoch = new Buchung('','', null, null, null, null, null);
    public donnerstag = new Buchung('','', null, null, null, null, null);
    public freitag = new Buchung('','', null, null, null, null, null);

    //Variablen für montga.onclick , montag.class usw...
    public montagClass: string ="";
    public montagId: string="";
    public dienstagClass: string ="";
    public dienstagId: string="";
    public mittwochClass: string ="";
    public mittwochId: string="";
    public donnerstagClass: string ="";
    public donnerstagId: string="";
    public freitagClass: string ="";
    public freitagId: string="";

    constructor() {}

    setMontag(buchung: Buchung) {
      this.montag=buchung;
      this.montagId=buchung.firebaseKey;
    }
    setDienstag(buchung: Buchung) {
      this.dienstag=buchung;
      this.dienstagId=buchung.firebaseKey;
    }
    setMittwoch(buchung: Buchung) {
      this.mittwoch=buchung;
      this.mittwochId=buchung.firebaseKey;
    }
    setDonnerstag(buchung: Buchung) {
      this.donnerstag=buchung;
      this.donnerstagId=buchung.firebaseKey;
    }
    setFreitag(buchung: Buchung) {
      this.freitag=buchung;
      this.freitagId=buchung.firebaseKey;
    }

    toString(): string {
      return "ParkIds: "+ this.montag.parkId+","+this.dienstag.parkId+","+this.mittwoch.parkId+","+this.donnerstag.parkId+","+this.freitag.parkId;
    }

}
