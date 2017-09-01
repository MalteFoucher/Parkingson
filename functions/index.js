// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
'use strict';
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

//cors ist für Cross Origin Header
const cors = require('cors')({origin:true});
//const sync = require('synchronize');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

//const gmailEmail = 'maltewolfcastle';//encodeURIComponent(functions.config().g);
//const gmailPassword = 'AllesWirdGut2017';//encodeURIComponent(functions.config().gmail.password);
//'smtps://${gmailEmail}:${gmailPassword}@smtp.gmail.com'

//const from = 'ParkplatzTool <malte_kun@web.de>';
const from = 'ParkplatzTool <service@parken-eagle.com>';

const smtpConfig = {
    //host: 'smtp.web.de',
    host: 'smtp-relay.gmail.com',
    port: 465,
    auth: {
        user: 'service@parken-eagle.com',
        pass: '_C^M8dnN'
        //user: 'malte_kun@web.de',
        //pass: 'Koksun2014'
    }};

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
    //..fertig! Das heißt, an welcher Stelle sollte denn eigentlich die BEstätigungs-Email kommen?

    //Was jetzt folgt, ist ne selbsgemachte Willkommens-Email, aber wir wollen ja eh die Bestätigungs-Mail
    //von Firebase verschicken lassen.
    /*
    var mailOptions = {
        from: from,
        to: email,
        subject: 'Willkommen beim ParkplatzTool',
        text: "Hey na!",
        html: '<h1>Willkommen!</h1><p>Hi. Schön, dass du da bist! \n Blablablabla.</p>'
    };
    console.log("MailOptions erstellt!");

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Error: "+error);
        }
        console.log("PostSend: "+info);
    })
    */
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
  var to = req.query.to;
    console.log ("TESTEMAIL");
    response.writeHead(200, {'Content-Type': 'text/plain'});
    var mailOptions = {
        from: from,
        to: 'malte.foucher@deka.lu',
        //to: 'malte_kun@web.de',
        //to: 'foucherm@fh-trier.de',
        subject: 'Hallo',
        text: 'plaintext version of the message',
        html: '<h1>Hey na! TestFunktion!</h1><p>Paragraph</p>'
    };
    var res = sendEmail(mailOptions);
    response.end( res );
})


//Generiert und verschickt ne Email
exports.email = functions.https.onRequest((req, response) => {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    var to = req.query.to;
    var subject = req.query.subject;
    var text  = req.query.text;
    console.log ("Aufruf von email mit: "+to,subject, text);

    var mailOptions = {
        from: from,
        to: to,
        subject: subject,
        text: text,
        html: '<h1>ParkplatzTool</h1><p>'+text+'</p>'
    };
    var res = 'okay';
    res=sendEmail(mailOptions);
    response.end( res );
})


exports.b3getJahre = functions.https.onRequest((req, res) => {
    res.writeHead(200, {'Content-Type': 'application/json'});
    admin.database().ref('/buchungen3/').once('value')
        .then (function (snapshot) {
            var keys = Object.keys(snapshot.val());
            var response={};
            for (var k in keys) {
                response[k]=keys[k];
            }
            console.log ("Response von b3getJahre: ");
            console.log (response);
            res.end(response);
        })
        .catch(function (error) {
            console.log(error);
            res.end({failure:error});
        })
})

exports.b3isUserAlreadyInDB = functions.https.onRequest((req, res) => {
  cors (req, res, () => {
    var email = req.query.email;
    var emailAsKey = email.replace(/\./g, '!');
    res.writeHead(200, {'Content-Type': 'text/plain'});
        admin.database().ref('/emailToRole/').orderByKey().equalTo(emailAsKey).once('value')
            .then (function (snapshot) {
                //console.log ("b3isUser... : "+snapshot.val());
                if (snapshot.val()) {
                    //console.log("true, weil gibts schon");
                    res.end("true");
                } else {
                    //console.log("false, weil gibts noch nicht");
                    res.end("false");
                }
            })
            .catch(function (error) {
                //console.log("Error, weil "+error);
                res.end("failure:"+error);
            })
  });
})

exports.buchung = functions.database.ref('/buchungen3/{year}/{day}/{key}').onWrite(event => {
  // const eventSnapshot = event.data;
  console.log("event: " + JSON.stringify(event));
  const data = event.data;
  console.log("data: " + JSON.stringify(data));

  const prev = data.previous;
  console.log("prev: " + JSON.stringify(prev));

  if(!prev.exists()) {
    console.log("Parkplatz freigeben.");
  }
  else if (!data.exists()) {
    const mId = prev.val().mId;
    console.log("mId: " + mId);
    if(mId!=null) {
      console.log('Buchung vom Vermieter storniert.');
    } else {
      console.log('Freigabe aufgehoben.');
    }
  }else {
    const mId = data.val().mId;
    console.log("mId: " + mId);
    if(mId!=null) {
      console.log('Parkplatz gebucht.')
    } else {
      console.log('Buchung vom Mieter storniert.');
    }
  }
});


