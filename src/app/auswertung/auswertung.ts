// Klasse, die Daten einer Auswertung (bezogen auf einen User enthält)

export class Auswertung {

    public parkId: number=0;
    public uid: string;
    public user_email: string;
    public freigaben: number=0;
    public davon_gebucht: number=0;
    

    constructor(uid: string) {
        this.uid = uid;        
    }

    public incFreigaben() {        
        this.freigaben++;        
    }
    public incGebucht() { 
        this.davon_gebucht++;
    }

    public setEmail(email: string) {        
        if (email) {
          this.user_email = email;
        } else {
          this.user_email = "Unbekannte UserId";
        }
    }
    public setParkId(pid: number) {        
      this.parkId=pid;        
    }
}