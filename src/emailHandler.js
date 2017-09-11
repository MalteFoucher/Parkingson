
document.addEventListener('DOMContentLoaded', function() {
  console.log ("DOMContentLoaded...");
  // Get the action to complete.
  var mode = getParameterByName('mode');
  // Get the one-time code from the query parameter.
  var actionCode = getParameterByName('oobCode');
  // (Optional) Get the API key from the query parameter.
  var apiKey = getParameterByName('apiKey');
  // (Optional) Get the continue URL from the query parameter if available.
  var continueUrl = getParameterByName('continueUrl');

  // Configure the Firebase SDK.
  // This is the minimum configuration required for the API to be used.
  console.log("Api-Key: "+apiKey);
  console.log("Mode: "+mode);
  var config = {
    'apiKey': apiKey  // This key could also be copied from the web
                      // initialization snippet found in the Firebase console.
  };
  var app = firebase.initializeApp(config);
  var auth = app.auth();

  // Handle the user management action.
  switch (mode) {
    case 'resetPassword':
      // Display reset password handler and UI.
      handleResetPassword(auth, actionCode, continueUrl);
      break;
    case 'recoverEmail':
      // Display email recovery handler and UI.
      handleRecoverEmail(auth, actionCode);
      break;
    case 'verifyEmail':
      // Display email verification handler and UI.
      handleVerifyEmail(auth, actionCode, continueUrl);
      break;
    default:
      // Error: invalid mode.
  }
}, false);
