console.log('[SMS MODULE] Loaded at', new Date().toISOString());

// added line because environment variables were not loading
require('dotenv').config();

const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials are not set in environment variables');
}

const client = twilio(accountSid, authToken);

/**
 * Send initial alert SMS when danger is detected
 * @param {string} dangerLevel - The danger level: 'SAFE', 'WARNING', or 'DANGER'
 * @param {string} description - AI-generated description of the situation
 */
async function sendInitialAlertSMS(dangerLevel, description) {
  const body = `🚨 SECURITY ALERT - Danger Level: ${dangerLevel}\n\n` +
    `Situation: ${description}\n\n` +
    `Reply with:\n` +
    `"1" for details\n` +
    `"2" for image`;

  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_FROM_NUMBER,
      to: process.env.TWILIO_TO_NUMBER,
    });

    console.log(`[SMS] Initial alert sent successfully. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('[SMS] Failed to send initial alert:', error);
    throw error;
  }
}

/**
 * Send status response SMS
 * @param {string} dangerLevel - The current danger level
 * @param {string} description - Detailed description
 */
async function sendStatusResponseSMS(dangerLevel, description) {
  const timestamp = new Date().toISOString();
  const body = `📊 STATUS UPDATE\n\n` +
    `Danger Level: ${dangerLevel}\n` +
    `Time: ${timestamp}\n` +
    `Details: ${description || 'No additional details available'}\n\n` +
    `Reply "2" for current image.`;

  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_FROM_NUMBER,
      to: process.env.TWILIO_TO_NUMBER,
    });

    console.log(`[SMS] Status response sent successfully. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('[SMS] Failed to send status response:', error);
    throw error;
  }
}

/**
 * Send image/frame response SMS
 * Note: Currently sends a placeholder message. To send actual images:
 * 1. Capture frame from camera backend
 * 2. Upload to cloud storage (S3, Cloudinary, etc.)
 * 3. Send URL in SMS or use Twilio Media URL feature
 */
async function sendImageResponseSMS() {
  const body = `📷 CAMERA FRAME\n\n` +
    `Current frame capture feature coming soon.\n` +
    `For now, please check your security camera system directly.\n\n` +
    `Reply "1" for status update.`;

  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_FROM_NUMBER,
      to: process.env.TWILIO_TO_NUMBER,
    });

    console.log(`[SMS] Image response sent successfully. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('[SMS] Failed to send image response:', error);
    throw error;
  }
}

// Export functions for use in other modules
module.exports = {
  sendInitialAlertSMS,
  sendStatusResponseSMS,
  sendImageResponseSMS,
  client,
};




//***************************************
// HARD CODED TESTING - TO BE REMOVED LATER
//***************************************

if (require.main === module) {
  (async () => {
    try {
      await sendInitialAlertSMS(
        'LOW',
        'bomb..'
      );
      console.log('Test completed');
    } catch (e) {
      console.error(e);
    }
  })();
}