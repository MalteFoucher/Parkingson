// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
'use strict';
const functions = require('firebase-functions');
const moment = require('moment');

// cors ist f�r Cross Origin Header
const cors = require('cors')({origin:true});

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

// *** Allerhand Kram für Emailversand
const nodemailer = require('nodemailer');
const from = 'ParkplatzTool <service@parken-eagle.com>';

const smtpConfig = {
    pool: true,
    maxConnections: 3,
    
    host: functions.config().smtp.host,
    port: functions.config().smtp.port,

    //host: 'w017568b.kasserver.com',         //unser All-inkl Host, steht aber alles in functions.config()
    //port: 465,
    //user: 'm040d1e7',
    //pass: 'Malte12345'
    auth: {        
        user: functions.config().smtp.user,
        pass: functions.config().smtp.pass
    }
};
const transporter = nodemailer.createTransport(smtpConfig);
// ***


/*exports.onRemoveUser = functions.database.ref('/emailToRole/{emailKey}')
    .onDelete(event => {
        var removedEntry= event.data.previous.val();
        admin.auth().deleteUser(removedEntry.uid)
        .catch(error => {
            console.log ("Zur ID "+removedEntry.uid + " lag kein Eintrag vor! Macht aber n�scht!");
        });
    });
*/

exports.welcomeUser = functions.auth.user().onCreate(event => {
    const user = event.data;
    const email = user.email;
    const emailAsKey = email.replace(/\./g, '!');

    var db = admin.database();
    var ref = db.ref('/emailToRole/' + emailAsKey);
    //Die bei der Registrierung generierte UserId im DB-Eintrag ergänzen
    ref.update({
      uid: user.uid
    });
    console.log ("Neuer User registriert: "+emailAsKey+"/"+user.uid);
})


function sendEmail(mailOptions) {    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log("SendEmail-Error: " + error);        
    });    
}


//...emails verschicken - debug! Kann sp�ter weg!
exports.testEmail = functions.https.onRequest((req, response) => {
    transporter.verify(function(error, success) {
        if (error) {
            console.log("TestEmail-Error: "+error);
        } else {
            console.log('Server is ready to take our message');
        }
    });
    var to = req.query.to;
    response.writeHead(200, {'Content-Type': 'text/plain'});
    var mailOptions = {
        from: from,
        to: 'malte.foucher@deka.lu',
        subject: 'Hallo',
        text: 'plaintext version of the message',
        html: '<h1>Hey na! TestFunktion!</h1><p>Paragraph</p>'
    };
    sendEmail(mailOptions);
    response.end( "ok" );
})


exports.b3getJahre = functions.https.onRequest((req, res) => {
  cors (req, res, () => {
    admin.database().ref('/buchungen3/').once('value')
        .then (snapshot => {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            var keys = Object.keys(snapshot.val());
            var response="";
            for (var k in keys) {
                response+=keys[k]+";";                
            }            
            res.end(response);
        })
        .catch(function (error) {
            console.log("b3getJahre-Error: "+error);
            res.end("error");
        })
  })
})

exports.b3isUserAlreadyInDB = functions.https.onRequest((req, res) => {
  cors (req, res, () => {
    var email = req.query.email;
    var emailAsKey = email.replace(/\./g, '!');
    res.writeHead(200, {'Content-Type': 'text/plain'});
        admin.database().ref('/emailToRole/').orderByKey().equalTo(emailAsKey).once('value')
            .then (function (snapshot) {
                if (snapshot.val()) {
                    res.end("true");
                } else {
                    res.end("false");
                }
            })
            .catch(function (error) {
                res.end("failure:"+error);
            })
  });
})

exports.buchung = functions.database.ref('/buchungen3/{year}/{day}/{key}').onWrite(event => {  
  const data = event.data;  
  const prev = data.previous;  
  const dataVal = data.val();
  const prevVal = prev.val();

  const date = moment();
  date.year(event.params.year);
  date.dayOfYear(event.params.day);

  const pId = dataVal ? dataVal.pId : prevVal.pId;
  var datum = date.format("DD.MM.YYYY");
  // const ppText = "Parkplatz " + pId +  " am " + ;

  if(!prev.exists()) {
    // buchungM(ppText + " freigegeben.", dataVal.mId, null);
  }
  else if (!data.exists()) {
    const mId = prevVal.mId;
    //console.log("mId: " + mId);
    //console.log("prevVal.vId: " + prevVal.vId);
    if(mId!=null) {
      buchungM("Stornierung der Buchung",stornierungVermieterVermieter, stornierungVermieterMieter, prevVal.vId, mId,pId ,datum);
    } else {
      // buchungM('Freigabe von ' + ppText + ' aufgehoben.', prevVal.vId, mId);
    }
  } else {
    var mId = dataVal.mId;
    const prevMId = prevVal != null ? prevVal.mId : null;
    //console.log("mId: " + mId);
    if(mId!=null) {
      if(prevMId!= null){
        // data.ref.update({mId: prevMId});
      }else{
        //console.log("Buchungsbestätigung");
        buchungM("Buchungsbestätigung", buchungVermieter, buchungMieter, dataVal.vId, mId,pId ,datum)
        .then (res => {
            //console.log ("Zuräck aus buchungM f. B.Bestätigung: "+res);
        });
      }
    } else {
      //console.log("Stornierung");
      buchungM("Stornierung der Buchung", stornierungMieterVermieter, stornierungMieterMieter, dataVal.vId, prevMId,pId ,datum)
      .then (res => {
            //console.log ("Zuräck aus buchungM f. Stornierung: "+res);
        });
    }
  }
  //console.log("...BUCHUNG ENDE!");
});

const buchungVermieter = "Ihr Parkplatz #p wurde am #d von #m gebucht.";
const buchungMieter = "Sie haben den Parkplatz #p am #d von #v gebucht.";
const stornierungVermieterVermieter = "Sie haben #m's Buchung ihres Parkplatzes #p am #d storniert.";
const stornierungVermieterMieter = "Ihre Buchung des Parkplatzes #p am #d wurde vom Vermieter #v storniert.";
const stornierungMieterVermieter = "Die Buchung Ihres Parkplatzes #p am #d wurde vom Mieter #m storniert.";
const stornierungMieterMieter = "Sie haben Ihre Buchung des Parkplatzes #p von #v am #d storniert.";

const buchungM = (subject, textVermieter, textMieter, vermieter, mieter, pp, datum) => {

  //console.log("MAIL: vermieter: " + vermieter+" / mieter: " + mieter+ " / "+ transporter.isIdle());

  //console.log("mail - vermieter id : " + vermieter);
  //console.log("mail - mieter id : " + mieter);

  if (mieter == null || vermieter == null || mieter == "not set yet" || vermieter =="not set yet") {
    console.error("vermieter oder mieter is null: " + vermieter + " - " + mieter);
    console.error("textVermieter: " + textVermieter);
    console.error("textMieter: " + textMieter);
    return;
  }

  return new Promise(function (resolve, reject) {
    var ref = admin.database().ref('/emailToRole/');
    var messageRef = admin.database().ref('/messages/');

    ref.orderByChild('uid').equalTo(vermieter).once('value').then( vData => {
        //console.log("vData: " + JSON.stringify(vData.val()));
        var mailVermieter = Object.keys(vData.val())[0].replace(/!/g,'.');

        if (mieter) {
        ref.orderByChild('uid').equalTo(mieter).once('value').then( mData => {
            //console.log("mData: " + JSON.stringify(mData.val()));
            var mailMieter = Object.keys(mData.val())[0].replace(/!/g,'.');

            textVermieter = textVermieter.replace("#v",mailVermieter).replace('#m',mailMieter).replace("#p",pp).replace("#d", datum);
            textMieter = textMieter.replace("#v",mailVermieter).replace('#m',mailMieter).replace("#p",pp).replace("#d", datum);

            messageRef.push(
                {
                    to: mailVermieter,
                    subject: subject,
                    text: textVermieter});

            messageRef.push(
                {
                    to: mailMieter,
                    subject: subject,
                    text: textMieter});

        },error => {
          console.log ("Mieter Email finden-ERROR: "+error);
        });
        }   //Ende von if(mieter)

    }, error => {
        console.log ("Vermieter Email finden-ERROR: "+error);
        reject(error);
    }); //Ende vom vermieter.then


  resolve("alles gut")  ;
  }); //Ende vom Return new Promise
}




exports.setEveryonesActiveFlag = functions.https.onRequest((req, res) => {
  //Die Funktion habe ich geschrieben um am 19.09 um 12:00 alle User auf aktiv zu setzen.
  //War angedacht, in der Query einen Wert zu �bergeben, um ggf. auch auf inaktiv zu setzen.
  //Der �bergabewert ist aber "true" statt true, als kein boolean. W�re nat�rlich m�glich, das
  //irgendwie abzufangen, aber aus Faulheit lasse ich das mit dem Parameter und setze hier einfach
  //alles stumpf auf true.

  cors (req, res, () => {
    //var state = req.query.state;
    var state=true;
    var i=0;
    console.log ("Set Everyone's isActive - Flag to "+state);
    admin.database().ref('/emailToRole/').orderByKey().once('value')
    .then (function (snapshot) {
        if (snapshot.val()) {
            var keys = Object.keys(snapshot.val());
            for (var key in keys) {
                i++;
                console.log ("Setze isActive von "+keys[key] +" auf "+state);
                admin.database().ref('/emailToRole/').child(keys[key]).update(
                    {isActive: true}
                );
            }
        }
        res.end(i+ " Einträge geupdated.");
    });
  });
})

exports.updateUserEmail = functions.https.onRequest((req, res) => {
    cors (req, res, () => {

        var uid = req.query.uid;
        var newEmail = req.query.email;
        console.log ("Email des Users "+uid+ " updaten auf: "+newEmail);
        admin.auth().updateUser(uid,
            {
                email: newEmail
            })
        .then(userRecord=> {
            console.log ("Erfolgreich geupdated: "+JSON.stringify(userRecord));
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end("OK");
        })
        .catch(error => {
            console.log ("Fehler beim Updaten: "+error);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end(error);
        })
    });
})

exports.checkBuchungen = functions.https.onRequest((req, res) => {
  admin.database().ref("/buchungen3").once('value').then(snapshot => {
    var out = "";
    var val = snapshot.val();
    var years = Object.keys(val);
    years.forEach(y => {
      var year = val[y];
      var days = Object.keys(year);
      days.forEach(d => {
        var day = year[d];
        var test = {};
        var values = Object.keys(day);
        values.forEach(v => {
          var value = day[v];
          var pId = value.pId;
          if (test[pId] != null) {
            var text = "Doppelbuchung: " + d + "." + y + " " + JSON.stringify(value) + " - " + JSON.stringify(test[pId]);
            out += text + "\n";
            console.error(text);
          }
          else {
            test[pId] = value;
          }
        });
      });
    });
    res.end(out);
  });
});

exports.deleteUser = functions.https.onRequest((req, res) => {
    cors (req, res, () => {                
        var uid = req.query.uid;    
        var key = req.query.key;
        console.log ("deleteUser: uid:"+uid+" / key:"+key);
        
        firebase.database().ref('/emailToRole/'+key).remove()
        .then(result => {
            if (uid != "not set yet") admin.auth().deleteUser(uid);
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end("OK");
        })
        .catch(error => {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end(error);
        });
    });
})


exports.onMessageDelete = functions.database.ref('/messages/{key}').onDelete(event => {
  console.log ( "message onDelete...");  
  sendMessages(); // Die erste nehmen und versenden
})

exports.onMessageCreate = functions.database.ref('/messages/{key}').onCreate(event => {
  console.log ( "message onCreate...");
  var data=event.data.val();  
  data.from=from;
  //data.to=event.data['to'];
  //data.subject=event.data['subject'];
  //data.text=event.data['text'];
  console.log(data);
  console.log ( "Per Hand verschicken: "+JSON.stringify(data));
  //console.log ("transporter idle: "+transporter.isIdle() );
  if (transporter.isIdle()) {
    
    transporter.sendMail(data, (error, info) => {
        
        if (!error) {
            //Email wurde verschickt -> Message löschen.
            console.log ("OnCreate-Email verschickt-> löschen!");
            admin.database().ref('/messages/').child(event.params.key).remove();
        } else {
            console.log ("OnCreate-Error beim Emailverschicken:"+ error);
            //Email wurde nicht verschickt. Unterscheiden, warum:                    
            //Falls 550 (recipient rejected) : Email löschen und somit neues Update-Event
            if (error.responseCode=="550") {                        
                admin.database().ref('/messages/').child(event.params.key).remove();
            }
        }
    });            
  }  
  
})


function sendMessages() {
    console.log("sendMessages...");    
    admin.database().ref('/messages/').once('value')
    .then (function (snapshot) {      
      //console.log("Messages: "+JSON.stringify(snapshot.val()));
      
      if (snapshot.val()) {
        var keys = Object.keys(snapshot.val());
        var msg=snapshot.val()[keys[0]];
        msg.from=from;
        console.log ("Erste Message ("+keys[0]+") aus Queue holen und versenden: "+JSON.stringify(msg));
        
        //console.log ("transporter idle: "+transporter.isIdle() );
        if (transporter.isIdle()) {
            transporter.sendMail(msg, (error, info) => {
                
                
                if (!error) {
                    //Email wurde verschickt -> Message löschen.
                    console.log ("SendMessage-versand okay, message löschen!");
                    admin.database().ref('/messages/').child(keys[0]).remove();
                } else {
                    console.log ("SendMessage-mailversand error: "+error);
                    //Email wurde nicht verschickt. Unterscheiden, warum:                    
                    //Falls 550 (recipient rejected) : Email löschen und somit neues Update-Event                        
                    if (error.responseCode=="550") {                        
                        admin.database().ref('/messages/').child(keys[0]).remove();
                    }
                }
            });            
        }  
        
      }      
    });                 
}
