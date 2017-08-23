// Klasse, die uid und Email speichert. Nötig für die ANzeige im Template

export class Vermieter {

    public uid: string;
    public user_email: string;

    constructor(uid: string, email: string) {
        //Dafür gabs doch mal nen einfacheren Konstruktor oder?
        this.uid = uid;
        this.user_email= email;
    }

}