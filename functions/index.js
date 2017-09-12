// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
'use strict';
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const moment = require('moment');

//cors ist für Cross Origin Header
const cors = require('cors')({origin:true});//['https://www.parken-eagle.com', 'http://parken-eagle.com', 'https://parkplatztool.firebaseapp.com'], optionsSuccessStatus: 200});

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

//const gmailEmail = 'maltewolfcastle';//encodeURIComponent(functions.config().g);
//const gmailPassword = 'AllesWirdGut2017';//encodeURIComponent(functions.config().gmail.password);
//'smtps://${gmailEmail}:${gmailPassword}@smtp.gmail.com'

//const from = 'ParkplatzTool <malte_kun@web.de>'; //bruacht Port:578
const from = 'ParkplatzTool';// <service@parken-eagle.com>';

const smtpConfig = {
    //host: 'smtp.web.de',
    //host: 'smtp-relay.gmail.com',
    //host: 'smtp-relay.sendinblue.com',
    host: 'w0088c85.kasserver.com',
    //port: 587,    
    port: 465,    
    auth: {        
        //user: 'service@parken-eagle.com',     //gsuite
        //pass: '_C^M8dnN'
        //user: 'malte_kun@web.de',             //sendinblue
        //pass: 'darkwW6AQ7NPVh12'
        user: 'm040b7a3',                       //Romans all-inkl.com
        pass: 'JnrSqK9Gg6USH4cy'        
    }
    /*tls: {
        secure: true
        //rejectUnauthorized: false
    }*/
};

const transporter = nodemailer.createTransport(smtpConfig);

/*Funktion, die einen User löscht.
exports.deleteUser = functions.https.onRequest((req, response) => {

    //Wenn ich die uid habe, könnte ich darüber auch die Email und darüber auch
    //an die EmailAsKey kommen...
    //var emailAsKey = req.query.e2rKey;
    var uid=req.query.uid;

    console.log ("DeleteUser:"+emailAsKey+" / "+uid);
    response.writeHead(200, {'Content-Type': 'text/plain'});

    /*
    admin.auth().deleteUser(uid)
    .then (function() {
        console.log("Aus Auth gelöscht!");
        res="Aus Auth gelöscht.";
        var db = admin.database();
        var ref = db.ref('/emailToRole/'+emailAsKey).remove()
        .then (function() {
          console.log ("Aus DB gelöscht!");
        })
        .catch (function (error) {
          console.log ("Fehler beim Löschen aus DB."+error);
        });
    })
    .catch (function (error) {
        console.log("Fehler beim aus Auth löschen!"+error);
    });


})
*/
exports.onRemoveUser = functions.database.ref('/emailToRole/{emailKey}')
    .onDelete(event => {
        var removedEntry= event.data.previous.val();
        admin.auth().deleteUser(removedEntry.uid);
        console.log ("User "+removedEntry.uid+" wurde gelöscht!");
    });

//Listener für wenn User sich registrieren (check ob PW und Email korrekt sind, und auch, ob
//unter dem Key schon was in der DB stand, geschah client-seitig)
exports.welcomeUser = functions.auth.user().onCreate(event => {
    console.log("---welcomeUser---");
    const user = event.data;
    const email = user.email;
    const emailAsKey = email.replace(/\./g, '!');

    var db = admin.database();
    var ref = db.ref('/emailToRole/' + emailAsKey);
    //Die eben generierte UserId im DB-Eintrag ergänzen
    ref.update({
      uid: user.uid
    });
})

// Methode, um Emails zu verschicken
function sendEmail(mailOptions) {
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Error: " + error);
            return ("" + error);
        }
        //console.log("PostSend: " + info);
    return ("ok");
    })
}



//...emails verschicken - debug! Kann später weg!
exports.testEmail = functions.https.onRequest((req, response) => {
    transporter.verify(function(error, success) {
        if (error) {
            console.log(error);
        } else {
            console.log('Server is ready to take our message');
        }

    });

  var to = req.query.to;
    console.log ("TESTEMAIL");
    response.writeHead(200, {'Content-Type': 'text/plain'});
    var mailOptions = {
        from: from,
        to: 'malte.foucher@deka.lu',        
        subject: 'Hallo',
        text: 'plaintext version of the message',
        html: '<h1>Hey na! TestFunktion!</h1><p>Paragraph</p>'
    };
    var res = sendEmail(mailOptions);
    response.end( res );
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
                console.log (keys[k] + "; hinzugefügt!")
            }
            console.log ("Response von b3gJ: "+response);
            res.end(response);
        })
        .catch(function (error) {
            console.log(error);
            res.end("error");
        })
  })
})

exports.dummyFunc = functions.https.onRequest((req, res) => {
    console.log ("Dummdidummdudumm...");
});


exports.b3isUserAlreadyInDB = functions.https.onRequest((req, res) => {
  console.log ("b3isUser... : ");
  cors (req, res, () => {
    var email = req.query.email;
    var emailAsKey = email.replace(/\./g, '!');
    res.writeHead(200, {'Content-Type': 'text/plain'});
        admin.database().ref('/emailToRole/').orderByKey().equalTo(emailAsKey).once('value')
            .then (function (snapshot) {
                
                if (snapshot.val()) {
                    console.log("true, weil gibts schon");
                    res.end("true");
                } else {
                    console.log("false, weil gibts noch nicht");
                    res.end("false");
                }
            })
            .catch(function (error) {
                console.log("Error, weil "+error);
                res.end("failure:"+error);
            })
  });
})

exports.buchung = functions.database.ref('/buchungen3/{year}/{day}/{key}').onWrite(event => {
  console.log("event: " + JSON.stringify(event));
  const data = event.data;
  console.log("data: " + JSON.stringify(data));

  const prev = data.previous;
  console.log("prev: " + JSON.stringify(prev));

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
    console.log("mId: " + mId);
    console.log("prevVal.vId: " + prevVal.vId);
    if(mId!=null) {
      buchungM("Stornierung der Buchung",stornierungVermieterVermieter, stornierungVermieterMieter, prevVal.vId, mId,pId ,datum);
    } else {
      // buchungM('Freigabe von ' + ppText + ' aufgehoben.', prevVal.vId, mId);
    }
  } else {
    var mId = dataVal.mId;
    const prevMId = prevVal != null ? prevVal.mId : null;
    console.log("mId: " + mId);
    if(mId!=null) {
      if(prevMId!= null){
        mId = prevVal;
        data.ref.update({mId: mId});
      }
      buchungM("Buchungsbestätigung", buchungVermieter, buchungMieter, dataVal.vId, mId,pId ,datum);
    } else {
      buchungM("Stornierung der Buchung", stornierungMieterVermieter, stornierungMieterMieter, dataVal.vId, prevMId,pId ,datum);
    }
  }
});

const buchungVermieter = "Ihr Parkplatz #p wurde am #d durch #m gebucht.";
const buchungMieter = "Sie haben den Parkplatz #p am #d von #v gebucht.";
const stornierungVermieterVermieter = "Sie haben die Buchung von Parkplatz #p am #d von #m storniert.";
const stornierungVermieterMieter = "Die Buchung des Parkplatzes #p am #d wurde von #v storniert.";
const stornierungMieterVermieter = "Die Buchung des Parkplatzes #p am #d wurde von #m storniert.";
const stornierungMieterMieter = "Sie haben die Buchung von Parkplatz #p von #v am #d storniert.";

const buchungM = (subject, textVermieter, textMieter, vermieter, mieter, pp, datum) => {
  console.log("MAIL: vermieter: " + vermieter+" / mieter: " + mieter);
  //Jetzt die Email-Adressen zu den IDs beziehen
  var ref = admin.database().ref('/emailToRole/');
  //Vermieter dürfte ja stets !=null sein.
  ref.orderByChild('uid').equalTo(vermieter).once('value').then( data => {
    //Vermieter-Adresse haben wir
    var mailVermieter = Object.keys(data.val())[0].replace(/!/g,'.');
    console.log ("Email des Vermieters: "+mailVermieter);


    if (mieter) {
        ref.orderByChild('uid').equalTo(mieter).once('value').then( data => {
        //Mieter-Adresse haben wir auch
        var mailMieter = Object.keys(data.val())[0].replace(/!/g,'.');

        console.log ("Email des Mieters: "+mailMieter);

        textVermieter = textVermieter.replace("#v",mailVermieter).replace('#m',mailMieter).replace("#p",pp).replace("#d", datum);
        textMieter = textMieter.replace("#v",mailVermieter).replace('#m',mailMieter).replace("#p",pp).replace("#d", datum);

        console.log('subject: ' + subject);
        console.log('textVermieter: ' + textVermieter);
        console.log('textMieter: ' + textMieter);

        var uselessVariable = sendEmail({
        from: from,
        to: mailVermieter,
        subject: subject,
        text: textVermieter}
      );

        var uselessVariable = sendEmail({
            from: from,
            to: Object.keys(data.val())[0].replace(/!/g,'.'),
            subject: subject,
            text: textMieter}
        );

    },error => {
      console.log ("ERROR: "+error);
    })
    }
  });
}

