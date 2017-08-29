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
const from = 'ParkplatzTool <malte@parkingtool-6cf77.firebaseapp.com>';
const smtpConfig = {
    host: 'smtp-relay.gmail.com',
    //host: 'smtp.web.de',
    port: 587,
    auth: {
        user: 'malte@parkingtool-6cf77.firebaseapp.com',
        pass: 'MalteMalte'
        //user: 'malte_kun@web.de',
        //pass: 'Koksun2014'
    }};

const transporter = nodemailer.createTransport(smtpConfig);


/*Funktion, die zu ner Email die Rolle zurückgibt. Gerade mal rausge *-t weil cors
exports.getRole = functions.https.onRequest((req, response) => {
    cors (req, response, () => {
        var email = req.query.email;
        email.replace(/./g, '!');
        admin.database().ref('/emailToRole/' + email).once('value')
            .then(function (snapshot) {
                var admin = snapshot.val().admin;
                var parkId = snapshot.val().parkId;
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end(parkId + '\n' + admin);
            })
            .catch(function (error) {
                //Wenn hier ein Error auftritt, dann wahrscheinlich, weil kein Eintrag zu der Email vorliegt, zB bei nem neu registrierten User.
                //Der kriegt dann default-Werte:
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end('null' + '\n' + 'false');
            })
    })
})
*/

//Funktion, die eine AuthInfo (wie Email-Adresse oder Displayname) zu einer UserId zurückliefert:
exports.getAuthInfo = functions.https.onRequest((req, response) => {
    var uid = req.query.uid;
    var key = req.query.key;
    admin.auth().getUser(uid).then(function (userRecord) {

        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end(userRecord[key]);
        })
        .catch(function(error) {
            console.log("Error : ",error);
            response.writeHead(200, {'Content-Type': 'text/plain'});
            response.end('fail');
        });

})

//Funktion, die in einem email2Role-Knoten Updates vornimmt
exports.updateE2R = functions.https.onRequest(( req, response) => {
    var email = req.query.email;
    var pid_val =  req.query.pid;
    var admin_val =  req.query.admin;
    var uid =  req.query.uid;
    console.log("Update "+email+" auf : "+ pid_val + " und "+admin_val+ " und "+uid);

    var db = admin.database();
    var userRef = db.ref("/emailToRole/"+email);

    userRef.set( {admin: admin_val, parkId: pid_val, uid: uid});
    response.end("success");
})

//Funktion, die sich mit einer geänderten Email-Adresse rumärgert (und mit den Infos des e2r - Knotens)
exports.updateEmailAdress = functions.https.onRequest(( req, response) => {
    var email_old = req.query.email_old.replace(/!/g,'.');
    var email_new = req.query.email_new.replace(/!/g,'.');
    var pid_val =  req.query.pid;
    var admin_val =  req.query.admin;
    var uid =  req.query.uid;

    var email_old_asKey = req.query.email_old;
    var email_new_asKey = req.query.email_new;

    response.writeHead(200, {'Content-Type': 'text/plain'});

    console.log(email_old, email_old_asKey, " -> " ,email_new, email_new_asKey, pid_val, admin_val);

    //Zuerst userId anhand der Email rausfinden
    admin.auth().getUserByEmail(email_old).then(function(userRecord) {
        console.log(Object.keys(userRecord));
        console.log("UserId zu "+email_old + " ist: "+userRecord.uid);
        var uid = userRecord.uid;
        //Jetzt email-Info updaten
        admin.auth().updateUser(uid, {email: email_new}).then (function(userRecord2) {
            console.log("Email im Auth geupdated auf: "+userRecord2.email);
            //Jetzt den neuen DB-Eintrag anlegen und den alten Löschen!...

            var db = admin.database();
            var ref = db.ref('/emailToRole/'+email_new_asKey);
            ref.set( {parkId: pid_val, admin: admin_val, uid: uid} );

            var ref = db.ref('/emailToRole/'+email_old_asKey);
            ref.set(null);
            response.end("success");

        }).catch(function(err) {
            console.log("Fehler beim Update der Email: "+err);
            response.end ("Fehler: "+err);
        });
    }).catch(function(err) {
        console.log("Fehler beim Beziehen der Uid durch Email: "+err);
        response.end ("Fehler: "+err);
    })

})

//Funktion, die einen User löscht. Natürlich hab ich wieder nur die Email parat, und kann einene User nur über uid identifizieren, daher...
//...erstmal Uid ermitteln. Danach muss der User noch aus email2Role entfernt werden. Vielleicht auch umgekehrte Reihenfolge :/
exports.deleteUser = functions.https.onRequest((req, response) => {
    var emailAsKey = req.query.email;
    var email = emailAsKey.replace(/!/g,'.');
    response.writeHead(200, {'Content-Type': 'text/plain'});

    admin.auth().getUserByEmail(email).then(function(userRecord) {

        console.log("UserId zu "+email + " ist: "+userRecord.uid);
        var uid = userRecord.uid;

        //Jetzt kann der User gelöscht werden:
        admin.auth().deleteUser(uid)
            .then(function() {
                //Aus Auth erfolgreich gelöscht, jetzt muss noch email2Role !
                var db = admin.database();
                var ref = db.ref('/emailToRole/'+emailAsKey);
                ref.set(null);
                response.end('success');
            })
            .catch(function(error) {
                response.end('Fehler: '+error);
            })
        //
    }).catch(function(error) {
        //Fehler beim Finden der Uid
        response.end('Fehler: '+error);
        })

})

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

//Für die Auswertung der Freigaben
exports.auswertung = functions.https.onRequest((req, res) => {
    //Bekommt ne UserId und die Info welcher Node durchsucht werden soll und zählt Buchungen mit
    //(Denkbar wäre auch ein Stop-Termin)
    var uid = req.query.uid;
    var node = req.query.node; //Node muss ne Jahreszahl sein, sonst haut das später mit der Verschachtelung nicht hin.
    var refString = '/buchungen/' + node + '/';
    var vermieterMap = {};
    //var freigabenMap = [];
    var response = "";
    var responseString="";  //nötig für detail-info
    res.writeHead(200, {'Content-Type': 'text/plain'});

    admin.database().ref(refString).once('value')
        .then(function (snapshot) {

            //Hier sammelt er eigentlich sämtliche Buchungen zusammen, nicht nur die der übergebenen Id.

            //response.end(parkId+'\n'+admin);
            var keys = Object.keys(snapshot.val());

            //Falls sämtliche User herausgesucht werden sollen, wird ne Hashmap erstellt: [UserId: {freigaben: x, davon_gebucht: y}]
            if (uid=='null') {
                for (var key in keys) { //Über Keys eines Jahres (=die KW)
                    //console.log( keys[key] + ": ");
                    var kwKeys = Object.keys(snapshot.val()[keys[key]]);
                    for (var k in kwKeys) {   //Über Keys der einzelnen KW (=die Buchungen)
                        //console.log ( keys[key] + "->" + kwKeys[k] );
                        var buchung = snapshot.val()[keys[key]][kwKeys[k]];
                        //Prüfen, ob HashMap den Key schon enthält
                        if (!(buchung.vermieter in vermieterMap)) {
                            vermieterMap[buchung.vermieter] = {freigaben: 1, davon_gebucht: 0};
                        } else {
                            vermieterMap[buchung.vermieter].freigaben++;
                        }
                        if (buchung.mieter != 'null') {
                            vermieterMap[buchung.vermieter].davon_gebucht++;
                        }
                    }
                }
            }
            //Falls ein konkreter User angegeben wurde, wird direkt ein String SÄMTLICHER Freigaben des Users gebastelt.

            else {
                console.log("Suche nach konkretem User " + uid);
                for (var key in keys) { //Über Keys eines Jahres (=die KW)
                    //console.log( keys[key] + ": ");
                    var kwKeys = Object.keys(snapshot.val()[keys[key]]);
                    for (var k in kwKeys) {   //Über Keys der einzelnen KW (=die Buchungen)
                        // console.log ( keys[key] + "->" + kwKeys[k] );
                        var buchung = snapshot.val()[keys[key]][kwKeys[k]];
                            //Prüfen, ob der gefundene Vermieter der übergebene ist.
                        console.log(buchung.vermieter, " / " + uid);
                        if (buchung.vermieter == uid) {
                            console.log("Freigabe von dem gefunden.");
                            responseString+=keys[key]+","; //KW
                                //Prüfen, ob HashMap den Key schon enthält
                            responseString+=kwKeys[k]+","; //Kürzel (Tag-ParkId)

                            if (!(buchung.vermieter in vermieterMap)) {
                                    vermieterMap[buchung.vermieter] = {freigaben: 1, davon_gebucht: 0};
                            //freigabenMap.push(buchung);
                                } else {
                                    vermieterMap[buchung.vermieter].freigaben++;
                                }
                                if (buchung.mieter != 'null') {
                                    vermieterMap[buchung.vermieter].davon_gebucht++;
                                }
                            responseString+=buchung.mieter+",";
                                //Bezahlt und erhalten interessiert doch keinen!
                            responseString+=buchung.bezahlt+",";
                            responseString+=buchung.erhalten+"\n";
                        }
                    }
                }
            }
            var keys = Object.keys(vermieterMap);



            //An dieser Stelle werden die (oder der) gefundenen Vermieter in einen Strign gepackt und dann zurückgeschickt.
            //Wäre (unter aufwendiger Synchronisation?) möglich, stattdessen Email oder Displaynames zurückzusenden aber... mal sehen, was ich genau brauche!
            for (var i in keys) {
                //Das wird doch wieder sone nebenläufikeits kackscheiße hier! Das kommt doch wieder nicht rechtzeitig an!
                /*
                admin.auth().getUser(uid).then(function (userRecord) {
                    console.log("Erfrage Email zu: "+uid);

                    //Ich könnte hier prüfen, ob i = keys.length und dann res.end machen, aber sagt ja auch keiner, dass alle anderen requests schon fertig zurück kamen!
                    //Ansonsten wieder clientseitig lauter Anfragen stellen. Also Uid als Antwort senden, und dann clienteitg nochmal für jede Uid die EMail erfragen :/
                    resultOfgetUser=userRecord.email;
                    //console.log("Email zu "+uid+" ist: "+resultOfgetUser)
                });
                */
                response += keys[i] + ", " + vermieterMap[keys[i]].freigaben + ", " + vermieterMap[keys[i]].davon_gebucht + "\n";
            }
            //console.log("Vermieter "+uid + " hat "+ freigaben+ " Freigaben gemacht (davon "+davon_gebucht+ " gebucht).");
            console.log(response);
            //Hier hänge ich die Detail-Infos einfach an den den String, was natürlich so nicht geht! Das heißt, ginge schon, sit aber so nicht vorgesehen!d
            res.end(response+responseString);
        })
        .catch(function (error) {
            console.log(error);
            res.end("failure:"+error);
        })
})

//Liefert alle Jahre, in denen Einträge gemacht wurden (sprich, für die Nodes da sind!)
exports.getJahre = functions.https.onRequest((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    admin.database().ref('/buchungen/').once('value')
        .then (function (snapshot) {
            var keys = Object.keys(snapshot.val());
            var responseString="";
            for (var k in keys) {
                responseString+=keys[k]+'\n';
            }
            res.end(responseString);
        })
        .catch(function (error) {
            console.log(error);
            res.end("failure:"+error);
        })
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

