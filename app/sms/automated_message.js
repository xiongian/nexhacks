const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials are not set in environment variables');
}

const client = twilio(accountSid, authToken);

client.messages
  .create({
    body: 'You are about to die...',
    from: process.env.TWILIO_FROM_NUMBER,
    to: process.env.TWILIO_TO_NUMBER,
  })
  .then(message => console.log(message.sid))
  .catch(error => console.error(error));
