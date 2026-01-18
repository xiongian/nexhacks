// 1. Install the Twilio library first
// npm install twilio

const twilio = require('twilio');

// Twilio credentials
const accountSid = 'ACb96565e1272259b4d301fc4fb35f6ea6'; // Your main Account SID
const authToken = '35deb071c68feee4f45db00d10c51a87';                 // Your Auth Token

const client = twilio(accountSid, authToken);

client.messages
  .create({
    body: 'You are about to die...',
    from: '+18303609592', // Your Twilio number
    to: '+15198354026'   // Destination number
  })
  .then(message => console.log(message.sid))
  .catch(error => console.error(error));
