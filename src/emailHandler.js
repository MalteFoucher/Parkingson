var app;
var auth;

var mode, actionCode, apiKey, continueUrl;
var accountEmail;
document.addEventListener('DOMContentLoaded', function() {
  

  // Get the action to complete.
  mode = getParameterByName('mode');
  // Get the one-time code from the query parameter.
  actionCode = getParameterByName('oobCode');
  // (Optional) Get the API key from the query parameter.
  apiKey = getParameterByName('apiKey');
  // (Optional) Get the continue URL from the query parameter if available.
  continueUrl = getParameterByName('continueUrl');

  // Configure the Firebase SDK.
  // This is the minimum configuration required for the API to be used.
  
  var config = {
    'apiKey': apiKey  // This key could also be copied from the web
                      // initialization snippet found in the Firebase c onsole.
  };
  app = firebase.initializeApp(config);
  auth = app.auth();

  // Handle the user management action.
  switch (mode) {
    case 'resetPassword':
      // Display reset password handler and UI.      
      document.getElementById("header3").innerHTML="Passwort zurücksetzen";
      $("#resetPasswordContainer").show();
      $("#verifyEmailContainer").hide();
      handleResetPassword(auth, actionCode, continueUrl);
      break;
    case 'recoverEmail':
      // Display email recovery handler and UI.
      handleRecoverEmail(auth, actionCode);
      break;
    case 'verifyEmail':
      // Display email verification handler and UI.      
      document.getElementById("header3").innerHTML="Email bestätigen";
      $("#resetPasswordContainer").hide();
      $("#verifyEmailContainer").show();
      handleVerifyEmail(auth, actionCode, continueUrl);
      break;
    default:
      // Error: invalid mode.
  }
}, false);


function getParameterByName(name) {
    var url = window.location.href;
    //name =
    var regex = new RegExp("[?&]"+name+"(=([^&#]*)|&|#|$)");
    results = regex.exec(url);    
    if(!results) return null;
    if(!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g," "));
    
}

function handleResetPassword(auth, actionCode, continueUrl) {
  
  // Verify the password reset code is valid.
  auth.verifyPasswordResetCode(actionCode).then(function(email) {
    accountEmail = email;

    // TODO: Show the reset screen with the user's email and ask the user for
    // the new password.    
    document.getElementById("resetPassword_userEmail").innerHTML=accountEmail;

    
  }).catch(function(error) {
    // Invalid or expired action code. Ask user to try to reset the password
    // again.
  });
}

function confirmNewPassword() {
// Save the new password.

var user_password=$("#resetPassword_input").val();
//Hier erstmal auf DEKA Conformity checken
const kleinBS = /[a-z]/;
const grossBS = /[A-Z]/;
const ziffern = /[0-9]/;
const sonderz = /\W/;

var zeichenTypenUsed=0;

if (kleinBS.test(user_password)) zeichenTypenUsed++;
if (grossBS.test(user_password)) zeichenTypenUsed++;
if (ziffern.test(user_password)) zeichenTypenUsed++;
if (sonderz.test(user_password)) zeichenTypenUsed++;

if (! (user_password.length>=10 && zeichenTypenUsed>=3) ) {
  //$("#resetPassword_status").innerHTML = 'Das eingegebene Passwort entspricht nicht den Passwortrichtlinien!';
  document.getElementById("resetPassword_status").innerHTML = 'Das eingegebene Passwort entspricht nicht den Passwortrichtlinien!';
  return;
}
    auth.confirmPasswordReset(actionCode, user_password).then(function(resp) {
      document.getElementById("resetPassword_status").innerHTML = 'Ihr Passwort wurde erneuert! Sie können jetzt zur Anwendung zurückkehren.';
      // Password reset has been confirmed and new password updated.
      auth.signInWithEmailAndPassword(accountEmail, user_password);

    }).catch(function(error) {
      // Error occurred during confirmation. The code might have expired or the
      // password is too weak.
      document.getElementById("resetPassword_status").innerHTML= 'Fehler beim Erneuern ihres Passworts: '+error;
    });
}

function handleVerifyEmail(auth, actionCode, continueUrl) {
  // Try to apply the email verification code.
  auth.applyActionCode(actionCode).then(function(resp) {
    // Email address has been verified.
    
    // TODO: Display a confirmation message to the user.
    // You could also provide the user with a link back to the app.
    document.getElementById("verifyEmail_status").innerHTML= 'Ihre E-Mail wurde erfolgreich verifiziert. Unter Umständen muss Ihr Account allerdings erst noch von der Hotline freigeschaltet werde.';
    // TODO: If a continue URL is available, display a button which on
    // click redirects the user back to the app via continueUrl with
    // additional state determined from that URL's parameters.
  }).catch(function(error) {
    // Code is invalid or expired. Ask the user to verify their email address
    // again.
    document.getElementById("verifyEmail_status").innerHTML= 'Fehler beim Verifizieren Ihrer E-Mail: '+error;
  });
}
