import { Component, ViewChild } from '@angular/core';
import * as firebase from 'firebase/app';
import * as moment from 'moment';
import { Buchung } from './buchung';
import { Tablerow } from './tablerow';
import { MdDialog, MdSnackBar } from '@angular/material';
import { MdCheckbox } from '@angular/material';
import { DialogComponent } from './dialog/dialog.component';
import { AdminDialogComponent } from './admin-dialog/admin-dialog.component';

import {Http, Response} from '@angular/http';
import {NgModule} from '@angular/core';
// Import HttpClientModule from @angular/common/http
import {HttpClientModule} from '@angular/common/http';

import { EmailService } from './email.service';


@Component({
  selector: 'kalender-component',
  templateUrl: './kalender.component.html',
  styleUrls: ['./kalender.component.css']
})

export class KalenderComponent {

  @ViewChild('adminModeCB') adminButton: MdCheckbox;
  @ViewChild('nurFreigabenCB') nurFreigaben: MdCheckbox;
  
  nurFreigabenAnzeigen: boolean=false;
  
  buli_status: string = "Bitte einloggen...";
  dialog: MdDialog;
  kw: number = 0;
  year: number = 2017;
  moment_today = moment();
  nodeRef: any;
  //snackBar: MdSnackBar;
  b3nodeRef: any;
  woche_von_bis: string=this.getVonBisString();
  buchungen: any;
  userId: string="initKalenderUserId";
  userParkId: number=-1;
  userAdmin: boolean = false;
  frist_tage: number=2;
  frist_stunde:number=(9.5*60); //Also in Minuten
  toggleState: any;

  montagArray: Buchung[] = new Array<Buchung>();
  dienstagArray: Buchung[] = new Array<Buchung>();
  mittwochArray: Buchung[] = new Array<Buchung>();
  donnerstagArray: Buchung[] = new Array<Buchung>();
  freitagArray: Buchung[] = new Array<Buchung>();
  tablerow: Tablerow = new Tablerow();
  tablerows: Tablerow[] = new Array<Tablerow>();

  //controller: any;

  constructor(dialog: MdDialog, private emailService: EmailService) {
    this.dialog=dialog;
    this.kw = parseInt(moment().format('WW'));
    this.year = parseInt(moment().format('YYYY'));
    

//    this.nodeRef=firebase.database().ref('/buchungen2/'+this.year+'/KW'+this.kw+'/');
//    this.nodeRef.orderByChild('parkId').on('value', this.buchungListener);
  }

  setUserId(uid: string):void {
    this.userId=uid;
  }

  wocheUmblaettern(days: number):void {
    this.moment_today.add(days, 'days');
    console.log("XXXX Tage umblättern: "+days+ " => "+this.moment_today.format('DD.MM.YYYY'));

    this.woche_von_bis = this.getVonBisString();

    this.year = parseInt(this.moment_today.format('YYYY'));
    this.kw = parseInt(this.moment_today.format('WW'));
    console.log("Listener ab & anmelden...")
    this.nodeRef.orderByChild('parkId').off('value', this.buchungListener);
    this.nodeRef=firebase.database().ref('/buchungen2/'+this.year+'/KW'+this.kw+'/');
    this.nodeRef.orderByChild('parkId').on('value', this.buchungListener);
    this.buli_status="Freigaben werden geladen...";
  }

  private getVonBisString(): string {
    var dayOfWeekAktuell = this.moment_today.day();
    var mom = this.moment_today.clone();
    var firstDayOfWeek = moment(mom.subtract(dayOfWeekAktuell-1, 'days')).format('DD.MM.YY');
    var lastDayOfWeek = moment(mom.subtract(mom.add(4, 'days'))).format('DD.MM.YY');
    return firstDayOfWeek+" - "+lastDayOfWeek;
  }

  private getDateOfColumnAsString(col: number): string {    
    var mom = this.moment_today.clone();
    mom.subtract(mom.day(), 'days');
    return mom.add(col, 'days').format('DD.MM.YY');
  }
  private getDateOfColumnAsMoment(col: number): any {    
    var mom = this.moment_today.clone();
    mom.subtract(mom.day(), 'days');
    return mom.add(col, 'days');
  }
  
  public buchungListener = (snapshot) => {
    
    if ( snapshot.val() != null ) {
      this.buchungen=snapshot.val();      
      this.generateTable();
    } else {
      this.buchungen={};
      this.generateTable();
    }    

  }


public generateTable() {
  console.log ("Aufruf generateTable() mit UserParkId: "+this.userParkId);
  //Wenn noch keine Userdaten gelesen (zB noch kein Login) wurden, auch nix anzeigen.
  if (this.userParkId<0) return;
  var vermieter : string;
  var mieter : string;
  var erhalten : boolean;
  var bezahlt : boolean;
  var tag: number;
  var parkId : number;

  this.montagArray.length=0;
  this.dienstagArray.length=0;
  this.mittwochArray.length=0;
  this.donnerstagArray.length=0;
  this.freitagArray.length=0;
  this.tablerows.length=0;

  var snapshot_keys = Object.keys(this.buchungen);
  var alle_freigaben = 0;
  var davon_gebucht=0;
  console.log("generateT: "+snapshot_keys);

  //Schleife über einzelne Buchungen
  for (var key in snapshot_keys) {
    vermieter =  this.buchungen[snapshot_keys[key]].vermieter;
    mieter = <string> this.buchungen[snapshot_keys[key]].mieter;
    erhalten = <boolean> this.buchungen[snapshot_keys[key]].erhalten;
    bezahlt = this.buchungen[snapshot_keys[key]].bezahlt;
    tag = this.buchungen[snapshot_keys[key]].tag;
    parkId = this.buchungen[snapshot_keys[key]].parkId;

    var buchung = new Buchung( vermieter, mieter, bezahlt, erhalten, tag, parkId, <string>snapshot_keys[key] );

    //An dieser Stelle müsste man (falls das wirklich sein soll) die bereits gebuchten 
    //Freigaben aussortieren. (Ausser User-Freigaben und User-Buchungen...)
    
    //Die Tage wären doch so ein schöner Index für ein 2dimnens Array
    
    //Checken, ob parkId eine Nummer ist. Falls nein, ist es wohl 'Freigabe hinzuf.' , welches vom Admin-Mode hinzugefügt wurde und hier rausgefischt wird.
    if (!isNaN(parkId )) {
      alle_freigaben++;
      console.log ("Einsortieren: "+this.nurFreigabenAnzeigen+" "+mieter+".");
      if (  !this.nurFreigabenAnzeigen || (this.nurFreigabenAnzeigen && mieter=="") ) {
        if (tag==1) this.montagArray.push(buchung);
        
        if (tag==2) this.dienstagArray.push(buchung);
        
        if (tag==3) this.mittwochArray.push(buchung);
        
        if (tag==4) this.donnerstagArray.push(buchung);
  
        if (tag==5) this.freitagArray.push(buchung);        
      }
    }
  } 
    //Anzahl Zeilen der Tabelle ermitteln
    var maxRows = this.montagArray.length;
    if (this.dienstagArray.length>maxRows) { maxRows = this.dienstagArray.length;}
    if (this.mittwochArray.length>maxRows) { maxRows = this.mittwochArray.length;}
    if (this.donnerstagArray.length>maxRows) { maxRows = this.donnerstagArray.length;}
    if (this.freitagArray.length>maxRows) { maxRows = this.freitagArray.length;}

    //So, Anzahl Zeilen der Tabelle ist bekannt, jetzt werden die Zellen zu tablerow-Instazen zusammengefügt
    //und in das Array 'tablerows' gepackt.
    console.log ("maxrows:"+maxRows);
    for (var i=0; i<maxRows; i++) {

      this.tablerow=new Tablerow();

      if (i<this.montagArray.length) {
        let montag = this.montagArray[i];
        this.tablerow.setMontag(montag);      
        if (montag.vermieter !='') this.tablerow.montagClass="availableslot";
        if (montag.mieter    !='') { this.tablerow.montagClass="unavailableslot"; davon_gebucht++ };
        if (montag.vermieter == this.userId) this.tablerow.montagClass="userslot";  
      }

      if (i<this.dienstagArray.length) {
        let dienstag = this.dienstagArray[i];
        this.tablerow.setDienstag(dienstag);
        if (dienstag.vermieter !='' ) this.tablerow.dienstagClass="availableslot";
        if (dienstag.mieter    !='' ) { this.tablerow.dienstagClass="unavailableslot"; davon_gebucht++ };
        if (dienstag.vermieter == this.userId) this.tablerow.dienstagClass="userslot";      
      }      

      if (i<this.mittwochArray.length) {
        let mittwoch = this.mittwochArray[i];
        this.tablerow.setMittwoch(mittwoch);
        if (mittwoch.vermieter !='') this.tablerow.mittwochClass="availableslot";
        if (mittwoch.mieter    !='') { this.tablerow.mittwochClass="unavailableslot"; davon_gebucht++ };
        if (mittwoch.vermieter == this.userId) this.tablerow.mittwochClass="userslot";
      }

      if (i<this.donnerstagArray.length) {
        let donnerstag = this.donnerstagArray[i];
        this.tablerow.setDonnerstag(donnerstag);
        if (donnerstag.vermieter !='') this.tablerow.donnerstagClass="availableslot";
        if (donnerstag.mieter    !='') { this.tablerow.donnerstagClass="unavailableslot"; davon_gebucht++ };
        if (donnerstag.vermieter == this.userId) this.tablerow.donnerstagClass="userslot";
      }

      if (i<this.freitagArray.length) {
        let freitag = this.freitagArray[i];
        this.tablerow.setFreitag(freitag);
        if (freitag.vermieter !='') this.tablerow.freitagClass="availableslot";
        if (freitag.mieter    !='') { this.tablerow.freitagClass="unavailableslot"; davon_gebucht++ };
        if (freitag.vermieter == this.userId) this.tablerow.freitagClass="userslot";              
      }

      this.tablerows.push(this.tablerow);
      console.log ("tablerow "+i+": "+this.tablerow);
      
    }
    this.buli_status= ""+alle_freigaben+" Freigaben, davon "+(alle_freigaben - davon_gebucht)+" verfügbar.";
    // Letzte Reihe mit FreigabeButtons erzeugen und der Buchungen-HashMap zufügen.
    // Class ist wichtig für CSS-Darstellung, die id(zb.'montag') für das wiederfinden in der Map.    
    if (this.userParkId>0 && !this.adminButton.checked) {
      this.tablerow=new Tablerow();      
      var freigabeBuchung; 
      var dummyBuchung = new Buchung('','', null, null, null, 'Freigabe unmöglich', null);
      var freigabeText = "P"+ this.userParkId+" freigeben";
      if (this.adminButton.checked) freigabeText+"Freigabe hinzuf.";
      
      freigabeBuchung = new Buchung(this.userId,'', null, null, 1, freigabeText, 'freigabe_Montag');
      if (this.isFreigabeMoeglich(1, this.userId)) {        
        this.tablerow.setMontag(freigabeBuchung);
        this.tablerow.montagClass="freigeben";
        this.buchungen['freigabe_Montag'] = freigabeBuchung;
      } else {        
        this.tablerow.setMontag(dummyBuchung);
        this.tablerow.montagClass="freigeben_unmoeglich";
      }
      

      if (this.isFreigabeMoeglich(2, this.userId)) {
        freigabeBuchung = new Buchung(this.userId,'', null, null, 2, freigabeText, 'freigabe_Dienstag');
        this.tablerow.setDienstag(freigabeBuchung);
        this.tablerow.dienstagClass="freigeben";
        this.buchungen['freigabe_Dienstag']= freigabeBuchung;
      } else {        
        this.tablerow.setDienstag(dummyBuchung);
        this.tablerow.dienstagClass="freigeben_unmoeglich";
      }

      if (this.isFreigabeMoeglich(3, this.userId)) {
        freigabeBuchung = new Buchung(this.userId,'', null, null, 3, freigabeText, 'freigabe_Mittwoch');
        this.tablerow.setMittwoch(freigabeBuchung);
        this.tablerow.mittwochClass="freigeben";
        this.buchungen['freigabe_Mittwoch'] =  freigabeBuchung;
      } else {        
        this.tablerow.setMittwoch(dummyBuchung);
        this.tablerow.mittwochClass="freigeben_unmoeglich";
      }

      if (this.isFreigabeMoeglich(4, this.userId)) {
        freigabeBuchung = new Buchung(this.userId,'', null, null, 4, freigabeText, 'freigabe_Donnerstag');
        this.tablerow.setDonnerstag(freigabeBuchung);
        this.tablerow.donnerstagClass="freigeben";
        this.buchungen['freigabe_Donnerstag']=  freigabeBuchung;
      } else {        
        this.tablerow.setDonnerstag(dummyBuchung);
        this.tablerow.donnerstagClass="freigeben_unmoeglich";
      }

      if (this.isFreigabeMoeglich(5, this.userId)) {
        freigabeBuchung = new Buchung(this.userId,'', null, null, 5, freigabeText, 'freigabe_Freitag');
        this.tablerow.setFreitag(freigabeBuchung);
        this.tablerow.freitagClass="freigeben";
        this.buchungen['freigabe_Freitag']=  freigabeBuchung;
      } else {        
        this.tablerow.setFreitag(dummyBuchung);
        this.tablerow.freitagClass="freigeben_unmoeglich";
      }

      //Freigabe Buttons nur anzeigen, falls User auch Vermieter ist.
      console.log("buli: userParkId: "+this.userParkId);
      //if (this.userParkId>0) 
      this.tablerows.push(this.tablerow);
      
    }

    // Letzte Reihe mit FreigabeButtons erzeugen falls man Admin ist
    if (this.adminButton.checked) {
      this.tablerow=new Tablerow();      
      var freigabeBuchung; 
      
      //Könnte ich das auslagern in ne Funktion (~setAllAdmin) der Tablerow-Klasse ?
      //zB this.tablerow = new Tablerow().setAllAdmin();
      freigabeBuchung = new Buchung('','', null, null, 1, 'Freigabe hinzuf.', 'freigabe_1');
      this.tablerow.setMontag( freigabeBuchung );
      this.tablerow.montagClass="freigeben";
      this.buchungen['freigabe_1'] = freigabeBuchung;
      
      freigabeBuchung = new Buchung('','', null, null, 2, 'Freigabe hinzuf.', 'freigabe_2');
      this.tablerow.setDienstag( freigabeBuchung );
      this.tablerow.dienstagClass="freigeben";
      this.buchungen['freigabe_2'] = freigabeBuchung;
      
      freigabeBuchung = new Buchung('','', null, null, 3, 'Freigabe hinzuf.', 'freigabe_3');
      this.tablerow.setMittwoch( freigabeBuchung );
      this.tablerow.mittwochClass="freigeben";
      this.buchungen['freigabe_3'] = freigabeBuchung;

      freigabeBuchung = new Buchung('','', null, null, 4, 'Freigabe hinzuf.', 'freigabe_4');
      this.tablerow.setDonnerstag( freigabeBuchung );
      this.tablerow.donnerstagClass="freigeben";
      this.buchungen['freigabe_4'] = freigabeBuchung;

      freigabeBuchung = new Buchung('','', null, null, 5, 'Freigabe hinzuf.', 'freigabe_5');
      this.tablerow.setFreitag( freigabeBuchung );
      this.tablerow.freitagClass="freigeben";
      this.buchungen['freigabe_5'] = freigabeBuchung;
      
      this.tablerows.push(this.tablerow);
    }
  
}
  public onItemClickListener(event) {
    console.log ("OCL!");

    //Die ganzen returns sollten später eignetlich rauskommen dürfen!

    //So umständlich an die id zu kommen, ist doch völliger Schwachsinn: 
    //kann im Template doch direkt onItemClickListener({{id}} sagen oder nicht?) -> Offenabr nicht!
    var target = event.target || event.srcElement || event.currentTarget;
    var idAttr = target.attributes.id;
    var value  = idAttr.value;
    if (!value) return;
    var clickedBuchung = this.buchungen[value];
    console.log ("onItemClickListener: ClickedBuchung = "+clickedBuchung.vermieter+" / "+clickedBuchung.mieter+".");

    //Falls auf einen der Freigabe-Buttons geklickt (werden Vermietern und/oder Admins angezeigt)
    //Wenn ich die admin buttons nicht mit freigabe_ beschrifte sondern mit bspw. admin_montag, dann wäre das hier evtl übersichtlicher
    if ( value.indexOf('freigabe_')!=-1 ) {      
      //Falls AdminMode aktiv... Admin-Freigabe-Dialog anzeigen
      if (this.adminButton.checked) { 
        var tag = clickedBuchung.tag;
        
        let dialogRef = this.dialog.open(AdminDialogComponent, {
          data:  {
            //controller: this.controller,
            buchung: clickedBuchung,
            titel: 'Buchung anlegen',
            text:'Vermieter auswählen, in dessen Namen die Freigabe angelegt werden soll.',
            modus: 'ANLEGEN',
            yesButtonText: 'Anlegen',
            yesButtonVisible: true,
            noButtonText:'Abbruch',
            noButtonVisible: true
          }
        });
        dialogRef.afterClosed().subscribe(selection => {          
          if (selection) {
            console.log ("Anlegen mit Id: ");
            console.log (dialogRef.componentInstance.getSelectedVermieter() );        
            //Hier jetzt id und parkid rausholen, prüfen ob der vermieter an diesem tag nicht bereits
            //ne freigabe hat und dann ne neue buchung pushen
            //var vermieter = dialogRef.componentInstance.getSelectedVermieter();
            if (dialogRef.componentInstance.getSelectedVermieter()) {
              var vermieter_uid = dialogRef.componentInstance.getSelectedVermieter().uid;
              var vermieter_parkId = dialogRef.componentInstance.getSelectedVermieter().parkId;
              //console.log ("Hat der User an Tag "+tag+" bereits ne Buchung laufen? : "+this.doesUserAlreadyHaveAFreigabeToday(tag,vermieter_uid));
              if (!this.doesUserAlreadyHaveAFreigabeToday(tag,vermieter_uid) ) {
                //User hat noch keine Freigaben an diesem Tag, also: neue anlegen!
                this.freigabeAnlegen( {
                  mieter: "",
                  vermieter: vermieter_uid,                  
                  parkId: vermieter_parkId,
                  tag: tag
                });
              }
            } 
          }
        });
      
    } else {

      //Falls Vermieter ne Freigabe macht...
        let dialogRef = this.dialog.open(DialogComponent, {
          data:  {buchung: clickedBuchung,
            titel: 'Eigene Freigabe',
            text:'Willst du deinen Parkplatz P'+this.userParkId+' am '+this.getDateOfColumnAsString(this.buchungen[value].tag)+' freigeben?',
            yesButtonText: 'Ja',
            yesButtonVisible: true,
            noButtonText:'Nein',
            noButtonVisible: true
          }
        }).afterClosed().subscribe(selection => {
          console.log("Selection: "+selection);
          if (selection) {
            this.freigabeAnlegen( {
              mieter: "",
              vermieter: this.userId,              
              parkId: this.userParkId,
              tag: this.buchungen[value].tag
            });
          } else {
            // User clicked 'Cancel' or clicked outside the dialog
          }
        });      
      }
    }

    //Falls Mieter auf eigene Buchung klickt -> Buchung anzeigen/storno
    if (this.userParkId == 0 && clickedBuchung.mieter==this.userId) {
      
      //Als erstes Mal die Email des Vermieters besorgen. Dazu eine Funktion, die vom Callback aufgerufen wird.
      
      this.getEmailToUid(clickedBuchung.vermieter, this.showBuchung, {buchung: clickedBuchung, fbKey: value});
      
    }

    //Falls Vermieter auf eigene Freigabe klickt
    //TODO: Muss auch erst die Mieter-Email beziehen und dann den Dialog bauen. Hab ich aber jetzt kein Bock drauf!
    if (this.userParkId == clickedBuchung.parkId) {
      var dialogText="Du hast deinen Parkplatz am "+this.getDateOfColumnAsString(clickedBuchung.tag)+" freigegeben. "
      if (clickedBuchung.mieter!="") dialogText+="Mieter ist: "+clickedBuchung.mieter;

		  let buchTag = this.getDateOfColumnAsMoment(clickedBuchung.tag);
      var stornoPossible = moment(buchTag).isSame(moment(),'day') && this.isEarlyEnough() || moment(buchTag).isAfter(moment(),'day'); 
			if (stornoPossible) dialogText+=" Stornierung ist noch möglich.";
      console.log ("Storno: "+stornoPossible);
      let dialogRef = this.dialog.open(DialogComponent, {
        data:  {buchung: clickedBuchung,
          userPid: this.userParkId,
          titel: 'Freigabe bearbeiten',
          text: dialogText,
          yesButtonText: 'Ok',
          yesButtonVisible: true,
          noButtonText:'Stornieren',
          noButtonVisible: stornoPossible}
      })
      .afterClosed().subscribe(selection => {
        console.log("Selection: "+selection);
        if (selection) {
          console.log ("garnix passiert");        
        } else {
          console.log ("Freigabe Storno!");
          var refString = '/buchungen2/'+this.year+'/KW'+this.kw+'/'+value;
          console.log ("Ref: "+refString);
          //update falsch, muss löschen!
          firebase.database().ref(refString).remove()
          .then ((promise: any) => {      
            console.log("freigabe storno Erfolg! Key gelöscht");
            //this.snackBar.open('Buchung erfolgreich storniert.');
          })
          .catch((error: any) => {
            console.log("freigabe stornor Mißerfolg! ");
            //Miserfolgsmeldung
            //this.snackBar.open('Buchung konnte nicht storniert werden: '+error.message);
          });    
        }
      });
      return;
    }

    //Falls Mieter auf eine freie Freigabe klickt -> Buchen
    if ( this.userParkId==0 && clickedBuchung.mieter=="") {
      if (!this.isBuchungMoeglich(clickedBuchung.tag)) {
        //Meldung, dass Buchen unmöglich
        return;
      }

      let dialogRef = this.dialog.open(DialogComponent, {
        data:  {buchung: clickedBuchung,
          titel: 'Parkplatz buchen',
          text:'Willst du den Parkplatz P'+clickedBuchung.parkId+' am '+this.getDateOfColumnAsString(this.buchungen[value].tag)+' buchen?',
          yesButtonText: 'Ja',
          yesButtonVisible: true,
          noButtonText:'Nein',
          noButtonVisible: true
        }
      }).afterClosed().subscribe(selection => {
        console.log("Selection: "+selection);
        if (selection) {
          this.freigabeBuchen( {
            mieter: this.userId,
            vermieter: this.buchungen[value].vermieter,
            erhalten: false,
            bezahlt: false,
            parkId: this.buchungen[value].parkId,
            tag: this.buchungen[value].tag
            
          }, value);
        } 
      });
      return;
    }

  }

//debug
  writeNewBuchung() {
    var tag = <number> moment().dayOfYear() ;    
    //tag += Math.round( (Math.random() * 90)-45 );
    tag = Math.round( Math.random()*60);
    var pp = Math.round( Math.random()*250);
    console.log ("WnB: "+this.year+" / "+ tag+" /" +pp);
    var mmt = moment().year(this.year).dayOfYear(tag);
    console.log ( "Tag "+tag+" in "+this.year+" entspricht: " + mmt.format('DD.MM.YYYY'));
    //Year und Tag kommen im endeffekt dann von der selectierten zelle natürlich 
    var b3nodeRef=firebase.database().ref('/buchungen3/'+this.year+'/'+tag);

    var newPostRef = b3nodeRef.push();
    newPostRef.set({
      mId: "",
      vId: this.userId,
      pId: pp
    });
  }

writeNewUser() {        
    var newPostRef = firebase.database().ref('/emailToRole/michael@jatomix!de')
    .set({
      benutzerAdmin: false,
      buchungsAdmin: false,
      isActive: false,
      parkId: 0,
      uid: "sechsSiebenAcht"
    });
    
  }

  private isEarlyEnough(): boolean {
	
		//true falls noch vor der oben definieren 9:30 - Frist, false sonst.		
		var now = moment();
		var todays_frist = moment();
		todays_frist.set('hour',0);
		todays_frist.set('minute',this.frist_stunde);
		todays_frist.set('seconds',0);		
		return now.isBefore(todays_frist);
	}

  private isFreigabeMoeglich(tag: number, vermieter: string): boolean {
    var then = this.getDateOfColumnAsMoment(tag);
    var now = moment();
    console.log ("THEN/NOW: "+then.format('DD.MM')+"/"+ now.format('DD.MM')+ "->"+then.isBefore(now,'days'));
    
    //Bedingung: Vergangene Tage fliegen raus, heute nach 09:30 fliegt raus. Alles andere untersuchen!
    if ( then.isBefore(now, 'days') ) return false;
    if ( (then.isSame(now, 'days') && !this.isEarlyEnough()) ) return false;

    //Sonstige Bedingungen passen, jetzt die Arrays der Buchungen durchsuchen    
    return !this.doesUserAlreadyHaveAFreigabeToday(tag, vermieter);    
  }

 private doesUserAlreadyHaveAFreigabeToday(tag: number, vermieter: string): boolean {
   console.log ("doesUserAlreadHave... "+ tag+ " / "+ vermieter);
   if (tag==1) {
      for (var b in this.montagArray) {
        if (this.montagArray[b].vermieter == vermieter) return true;
      }
    } 
    if (tag==2) {
      for (var b in this.dienstagArray) {
        if (this.dienstagArray[b].vermieter == vermieter) return true;
      }
    }
    if (tag==3) {
      for (var b in this.mittwochArray) {
        if (this.mittwochArray[b].vermieter == vermieter) return true;
      }
    }
    if (tag==4) {
      for (var b in this.donnerstagArray) {        
        if (this.donnerstagArray[b].vermieter == vermieter) return true;
      }
    }
    if (tag==5) {
      for (var b in this.freitagArray) {      
        if (this.freitagArray[b].vermieter == vermieter) return true;
      }
    }
    return false;
 } 

private isBuchungMoeglich(tag: number): boolean {
    var then = this.getDateOfColumnAsMoment(tag);
    var now = moment();
    console.log ("THEN/NOW: "+then.format('DD.MM')+"/"+ now.format('DD.MM')+ "->"+then.isBefore(now,'days'));
    
    //Bedingung: Vergangene Tage fliegen raus. Alles andere untersuchen!
    if ( then.isBefore(now, 'days') ) return false;
    //if ( (then.isSame(now, 'days') && !this.isEarlyEnough()) ) return false;

    //Sonstige Bedingungen passen, jetzt die Arrays der Buchungen durchsuchen
    if (tag==1) {
      for (var b in this.montagArray) {
        if (this.montagArray[b].mieter == this.userId) return false;
      }
    }    
    if (tag==2) {
      for (var b in this.dienstagArray) {
        if (this.dienstagArray[b].mieter == this.userId) return false;
      }
    }
    if (tag==3) {
      for (var b in this.mittwochArray) {
        if (this.mittwochArray[b].mieter == this.userId) return false;
      }
    }
    if (tag==4) {
      for (var b in this.donnerstagArray) {        
        if (this.donnerstagArray[b].mieter == this.userId) return false;
      }
    }
    if (tag==5) {
      for (var b in this.freitagArray) {      
        if (this.freitagArray[b].mieter == this.userId) return false;
      }
    }
    return true;    
  }

  private freigabeAnlegen(data: any) {
    if (this.isEarlyEnough) {
      var newPostRef = this.nodeRef.push();
      newPostRef.set(data);
    }
  }
//debug
private writeNewbuchung() {
    console.log ("WNB: NodeRef:");
    console.log(this.nodeRef);
      var newPostRef = this.nodeRef.push();
      newPostRef.set( {
        mieter: "",
        vermieter: this.userId,
        parkId: this.userParkId,
        tag: 4,
        datum: "24.08.2017"
      });
    
  }

  private freigabeBuchen(data: any, fbKey: string) {
    //Bediungen für Buchung wären ?
      
      var refString = '/buchungen2/'+this.year+'/KW'+this.kw+'/'+fbKey;
      console.log ("Ref: "+refString);
			
      firebase.database().ref(refString).update(data)
      .then ((promise: any) => {      
        console.log("Erfolg! ");
        //Erfolgsmeldung
        //this.snackBar.open('Buchung erfolgreich angelegt.');
      })
      .catch((error: any) => {
        console.log("Mißerfolg! ");
        //Miserfolgsmeldung
        //this.snackBar.open('Buchung konnte nicht angelegt werden: '+error.message);
      });    
    }
  
  private getEmailToUid(uid: string, callbackFunction: any, callbackData: any) {
    firebase.database().ref("/emailToRole/").orderByChild('uid').equalTo(uid).once('value').then( function(snapshot) {               
       callbackFunction(snapshot.val(), callbackData);
    });
  }
  
  public showBuchung = (snapshot:any, data: any) => {
  //showBuchung(snapshot: any, data: any) {
    var clickedBuchung = data.buchung;
    var value = data.fbKey;
    console.log ("snapshot: "+snapshot);
    console.log(".key: "+snapshot.key);
    var vermieter_email = Object.keys(snapshot)[0].replace(/!/g,".");
    
    var dialogText="Du hast den Parkplatz P"+clickedBuchung.parkId +" am "+this.getDateOfColumnAsString(clickedBuchung.tag)+" gebucht. ";
    dialogText+="Die Email-Adresse des Vermieters ist: "+vermieter_email; 

    let buchTag = this.getDateOfColumnAsMoment(clickedBuchung.tag);
    let stornoPossible = moment(buchTag).isSame(moment(),'day') && this.isEarlyEnough() || moment(buchTag).isAfter(moment(),'day'); 
    if (stornoPossible) dialogText+=" Eine Stornierung ist noch möglich.";
    console.log ("Storno: "+stornoPossible);
    let dialogRef = this.dialog.open(DialogComponent, {
      data:  {
        buchung: clickedBuchung,
        userPid: this.userParkId,
        titel: 'Freigabe bearbeiten',
        text: dialogText,
        yesButtonText: 'Ok',
        yesButtonVisible: true,
        noButtonText:'Stornieren',
        noButtonVisible: stornoPossible}
      })
    .afterClosed().subscribe(selection => {
      console.log("Selection: "+selection);
      if (selection) {
        console.log ("garnix passiert");        
      } else {
        console.log ("Storno!");
        var refString = '/buchungen2/'+this.year+'/KW'+this.kw+'/'+value;
        console.log ("Ref: "+refString);
        firebase.database().ref(refString).update({mieter:"", bezahlt:false})
        .then ((promise: any) => {      
          console.log("buchung storno Erfolg! ");
          //this.snackBar.open('Buchung erfolgreich storniert.');
        })
        .catch((error: any) => {
          console.log("buchung storno Mißerfolg! ");
          //Miserfolgsmeldung
          //this.snackBar.open('Buchung konnte nicht storniert werden: '+error.message);
        });    
      }
    });  
  }

  public onAdminButtonChange() {
    //console.log ("OABC: "+ Object.keys(this.adminButton));
    console.log ("OABC: "+ this.adminButton.checked);
    this.generateTable();
  }

  /*public setController(ctrl:any) {
    this.controller=ctrl;
  }*/

  public onNurFreigabenChange() {
    console.log ("NFA:");
    this.nurFreigabenAnzeigen = this.nurFreigaben.checked;
    console.log (this.nurFreigabenAnzeigen);
    this.generateTable();
  }

  public setUserRights(pid:number, admin:boolean) {    
    this.userParkId=pid;
    this.userAdmin=admin;
    this.nodeRef=firebase.database().ref('/buchungen2/'+this.year+'/KW'+this.kw+'/');
    this.nodeRef.orderByChild('parkId').on('value', this.buchungListener);
    this.buli_status="Freigaben werden geladen...";
  }

  emailTesten() {
    console.log("EMIALTESTEN");
    this.emailService.sendEmail().subscribe(data => console.log(data));
  }
}