// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
'use strict';
const functions = require('firebase-functions');
const moment = require('moment');

//const o = require('observable')
//var v = o()
var poolAccess=0;

// cors ist für Cross Origin Header
const cors = require('cors')({origin:true});

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

// *** Allerhand Kram für Emailversand
//var AsyncLock = require('async-lock');
//var lock = new AsyncLock();
var ReadWriteLock = require('rwlock');
var lock = new ReadWriteLock();

const nodemailer = require('nodemailer');
const from = 'ParkplatzTool <service@parken-eagle.com>';
const smtpConfig = {
    pool: true,
    maxConnections: 1,
    //rateDelta: 3000,
    //rateLimit: 15

    //host: 'smtp.web.de',
    //host: 'w0088c85.kasserver.com',             //romans All-inkl Host
    host: 'w017568b.kasserver.com',           //unser All-inkl Host
    port: 465,
    auth: {
        //user: 'm040b7a3',                       //Romans all-inkl.com
        //pass: '7p2HTfcyrtM2wfrY'
        user: 'm040d1e7',                       //Die endgültige all-inkl.com
        pass: 'Malte12345'        
    }
};
const transporter = nodemailer.createTransport(smtpConfig);
var messages = [];
transporter.on('idle', startSending);
//startSending();
// ***


exports.onRemoveUser = functions.database.ref('/emailToRole/{emailKey}')
    .onDelete(event => {
        var removedEntry= event.data.previous.val();
        admin.auth().deleteUser(removedEntry.uid);
    });


//Listener für wenn User sich registrieren (check ob PW und Email korrekt sind, und auch, ob
//unter dem Key schon was in der DB stand, geschah client-seitig)
exports.welcomeUser = functions.auth.user().onCreate(event => {
    const user = event.data;
    const email = user.email;
    const emailAsKey = email.replace(/\./g, '!');

    var db = admin.database();
    var ref = db.ref('/emailToRole/' + emailAsKey);
    //Die eben generierte UserId im DB-Eintrag ergänzen
    ref.update({
      uid: user.uid
    });
    console.log ("Neuer User registriert: "+emailAsKey+"/"+user.uid);
})

// Methode, um Emails zu verschicken
function sendEmail(mailOptions) {
    //console.log ("sendEmail(1) " + transporter.isIdle());
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("SendEmail-Error: " + error);            
        }
    });
    //console.log ("sendEmail(2) " + transporter.isIdle());
}


//...emails verschicken - debug! Kann später weg!
exports.testEmail = functions.https.onRequest((req, response) => {
    /*transporter.verify(function(error, success) {
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
    var res = sendEmail(mailOptions);
    */
    startSending();

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
                //console.log (keys[k] + "; hinzugefügt!")
            }
            //console.log ("Response von b3gJ: "+response);
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
  //console.log("event: " + JSON.stringify(event));
  const data = event.data;
  //console.log("data: " + JSON.stringify(data));

  const prev = data.previous;
  //console.log("prev: " + JSON.stringify(prev));

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
            //console.log ("Zurück aus buchungM f. B.Bestätigung: "+res);
        });
      }
    } else {
      //console.log("Stornierung");
      buchungM("Stornierung der Buchung", stornierungMieterVermieter, stornierungMieterMieter, dataVal.vId, prevMId,pId ,datum)
      .then (res => {
            //console.log ("Zurück aus buchungM f. Stornierung: "+res);
        });
    }
  }  
  //console.log("...BUCHUNG ENDE!");
});

const buchungVermieter = "Ihr Parkplatz #p wurde am #d von #m gebucht.";
const buchungMieter = "Sie haben den Parkplatz #p am #d von #v gebucht.";
const stornierungVermieterVermieter = "Sie haben die Buchung von Parkplatz #p am #d von #m storniert.";
const stornierungVermieterMieter = "Die Buchung des Parkplatzes #p am #d wurde von #v storniert.";
const stornierungMieterVermieter = "Die Buchung des Parkplatzes #p am #d wurde von #m storniert.";
const stornierungMieterMieter = "Sie haben die Buchung von Parkplatz #p von #v am #d storniert.";

const buchungM = (subject, textVermieter, textMieter, vermieter, mieter, pp, datum) => {
  //console.log("MAIL: vermieter: " + vermieter+" / mieter: " + mieter+ " / "+ transporter.isIdle());
  return new Promise(function (resolve, reject) {
    var ref = admin.database().ref('/emailToRole/');
    
    ref.orderByChild('uid').equalTo(vermieter).once('value').then( data => {        
        var mailVermieter = Object.keys(data.val())[0].replace(/!/g,'.');
        if (mieter) {
        ref.orderByChild('uid').equalTo(mieter).once('value').then( data => {            
            var mailMieter = Object.keys(data.val())[0].replace(/!/g,'.');       
            
            textVermieter = textVermieter.replace("#v",mailVermieter).replace('#m',mailMieter).replace("#p",pp).replace("#d", datum);
            textMieter = textMieter.replace("#v",mailVermieter).replace('#m',mailMieter).replace("#p",pp).replace("#d", datum);
        
            accessPool({
                    from: from,
                    to: mailVermieter,
                    subject: subject,
                    text: textVermieter})
                    .then(res => {
                        //console.log ("Pushed VermieterMessage to position "+res);               
                    });

                
                accessPool(
                    {
                    from: from,
                    to: Object.keys(data.val())[0].replace(/!/g,'.'),
                    subject: subject,
                    text: textMieter})
                    .then(res => {
                        //console.log ("Pushed MieterMessage to position "+res);
                        //Muss schon im .then-Block stehen. Aber halt ruhig im zweiten
                        if (transporter.isIdle() )    { 
                            //console.log ("buchungM stoesst den idling transporter an...");
                            startSending();
                        }
                    });
                            

        },error => {
          console.log ("Mieter Email finden-ERROR: "+error);
          reject(erro);
        });
        }   //Ende von if(mieter)

    }, error => {
        console.log ("Vermieter Email finden-ERROR: "+error);
        reject(error);
    }); //Ende vom vermieter.then
  
  resolve("alles gut")  ;
  }); //Ende vom Return new Promise
}



function startSending() {//function(){
    //console.log ("entering startSending @"+messages.length);
    // send next message from the pending queue
    
        //macht nur sinn bei >1 connections

        //while (messages.length) {
            //console.log(messages.length+ " in der Queue!");
            //var msg= messages.shift();
            if (transporter.isIdle()) {
                accessPool().then(msg => {
                    if (msg) {                
                        
                        //console.log ("Sending message: TO("+msg.to+")/TEXT("+msg.text+")");
                        
                        transporter.sendMail(msg, (error, info) => {
                        if (error) console.log("onIdle - SendEmail-Error: " + JSON.stringify(error));
                        //if (info)  console.log("onIdle - SendEmail: " + JSON.stringify(info));
                        //console.log("Verbleibende Messages: "+messages.length);
                    });
                    
                    } else {
                        console.log ("Keine messages in der Queue.");
                    }
                });
            }
        //}           
}

//Zugriffe auf die message queue will ich jetzt an dieser stelle irgendwie synchronisieren
function accessPool(optionalArg) {      
    poolAccess++;
    return new Promise(
        function (resolve, reject) {
            
            if (typeof optionalArg === 'undefined') {                
                var msg = messages.shift();
                if (msg) console.log("["+poolAccess+"] - Return #"+messages.length+": "+msg.to+"/"+msg.text);                                
                resolve (msg);
            } else {                
                messages.push(optionalArg);                
                console.log("["+poolAccess+"] - Push #"+messages.length+": "+optionalArg.to+"/"+optionalArg.text);                
                resolve(messages.length);
            }
            //reject(error);
        }
    );
}    
    
  