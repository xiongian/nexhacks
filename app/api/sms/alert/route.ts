import { NextRequest, NextResponse } from 'next/server';
import { initializeState, updateDangerLevel, shouldTriggerAlert, isThrottled, recordAlertSent } from '@/app/sms/smsState';
import smsModule from '@/app/sms/automated_message';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Initialize state on first run
    initializeState();

    const body = await request.json();
    const { dangerLevel, description, personGrid } = body;

    // Validate input
    if (!dangerLevel || !['SAFE', 'WARNING', 'DANGER'].includes(dangerLevel)) {
      return NextResponse.json(
        { error: 'Invalid or missing dangerLevel' },
        { status: 400 }
      );
    }

    // Update the consecutive danger count
    const consecutiveCount = updateDangerLevel(dangerLevel);

    console.log(
      `[SMS Alert API] Danger level: ${dangerLevel}, Consecutive count: ${consecutiveCount}`
    );

    // Check if we should send an alert
    if (shouldTriggerAlert() && !isThrottled()) {
      try {
        await smsModule.sendInitialAlertSMS(dangerLevel, description);

        // Record that we sent an alert
        recordAlertSent(dangerLevel, description, 'initial');

        return NextResponse.json(
          {
            success: true,
            message: 'Alert sent successfully',
            consecutiveCount,
          },
          { status: 200 }
        );
      } catch (error) {
        console.error('[SMS Alert API] Failed to send SMS:', error);
        return NextResponse.json(
          { error: 'Failed to send SMS', details: (error as Error).message },
          { status: 500 }
        );
      }
    } else if (shouldTriggerAlert() && isThrottled()) {
      console.log('[SMS Alert API] Alert throttled - last alert sent less than 1 minute ago');
      return NextResponse.json(
        {
          success: false,
          message: 'Alert throttled - will not send another alert within 1 minute',
          consecutiveCount,
          throttled: true,
        },
        { status: 429 } // Too Many Requests
      );
    } else {
      console.log(
        `[SMS Alert API] No alert needed - consecutive count (${consecutiveCount}) < 3`
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Not enough consecutive DANGER events to trigger alert',
          consecutiveCount,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('[SMS Alert API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
