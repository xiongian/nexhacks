import { NextRequest, NextResponse } from 'next/server';
import { initializeState, recordAlertSent, getState } from '@/app/sms/smsState';
import smsModule from '@/app/sms/automated_message';

export const runtime = 'nodejs';

/**
 * Webhook to receive incoming SMS messages from Twilio
 * Twilio will POST to this endpoint with message details
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize state on first run
    initializeState();

    // Parse the form data from Twilio
    const formData = await request.formData();
    const fromNumber = formData.get('From') as string;
    const messageBody = formData.get('Body') as string;
    const messageId = formData.get('MessageSid') as string;

    console.log(`[SMS Incoming] Received message from ${fromNumber}: "${messageBody}" (ID: ${messageId})`);

    // Validate that the message is from the expected recipient
    const expectedNumber = process.env.TWILIO_TO_NUMBER;
    if (fromNumber !== expectedNumber) {
      console.warn(`[SMS Incoming] Message from unexpected number: ${fromNumber}`);
      // Still respond with empty 200 to acknowledge receipt from Twilio
      return new NextResponse('', { status: 200 });
    }

    const response = messageBody.trim();

    if (response === '1') {
      // User requested current status
      console.log('[SMS Incoming] User requested status (response 1)');
      try {
        const state = getState();
        await smsModule.sendStatusResponseSMS(state.lastDangerLevel || 'UNKNOWN', '');
        recordAlertSent(state.lastDangerLevel || 'UNKNOWN', 'Status requested by user', 'response_1');
        return new NextResponse('', { status: 200 });
      } catch (error) {
        console.error('[SMS Incoming] Failed to send status response:', error);
        return new NextResponse('', { status: 200 }); // Still return 200 to Twilio
      }
    } else if (response === '2') {
      // User requested image
      console.log('[SMS Incoming] User requested image (response 2)');
      try {
        const state = getState();
        await smsModule.sendImageResponseSMS();
        recordAlertSent(state.lastDangerLevel || 'UNKNOWN', 'Image requested by user', 'response_2');
        return new NextResponse('', { status: 200 });
      } catch (error) {
        console.error('[SMS Incoming] Failed to send image response:', error);
        return new NextResponse('', { status: 200 }); // Still return 200 to Twilio
      }
    } else {
      // Invalid response
      console.log(`[SMS Incoming] Invalid response: "${response}". Expected "1" or "2"`);
      try {
        await sendInvalidResponseSMS();
        return new NextResponse('', { status: 200 });
      } catch (error) {
        console.error('[SMS Incoming] Failed to send invalid response message:', error);
        return new NextResponse('', { status: 200 }); // Still return 200 to Twilio
      }
    }
  } catch (error) {
    console.error('[SMS Incoming] Error processing message:', error);
    // Return 200 to Twilio even on error (don't want them to retry)
    return new NextResponse('', { status: 200 });
  }
}

/**
 * Helper function to send invalid response message
 */
async function sendInvalidResponseSMS() {
  const twilio = require('twilio');
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  await client.messages.create({
    body: 'Invalid response. Please reply with "1" for current status or "2" for current image.',
    from: process.env.TWILIO_FROM_NUMBER,
    to: process.env.TWILIO_TO_NUMBER,
  });
}
