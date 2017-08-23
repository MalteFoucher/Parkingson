export class Buchung {
    tag: number =0;
    parkId: any = 0;
    mieter: string = "";
    vermieter: string = "";
    bezahlt: boolean = false;
    erhalten: boolean = false;
    firebaseKey: string ="";

    dateString: string="";

    constructor( vermieter: string, mieter: string, bezahlt: boolean, erhalten: boolean, tag: number, parkId: any, key: string) {
      this.vermieter = vermieter;
      this.mieter = mieter;      
      this.bezahlt = bezahlt;
      this.erhalten = erhalten;
      this.tag=tag;
      this.parkId=parkId;
      this.firebaseKey = key;
      //console.log("Neue Buchung: "+vermieter, mieter, bezahlt, erhalten, tag, parkId, key);
    }

    public setDateString(date: string) {
      this.dateString = date;
    }
}
