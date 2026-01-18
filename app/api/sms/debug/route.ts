import { NextResponse } from 'next/server';
import { getState } from '@/app/sms/smsState';

/**
 * Debug endpoint to view SMS state
 * Visit: https://your-app.vercel.app/api/sms/debug
 */
export async function GET() {
  try {
    const state = getState();
    
    return NextResponse.json(
      {
        status: 'ok',
        state: {
          consecutiveDangerCount: state.consecutiveDangerCount,
          lastAlertSentTime: state.lastAlertSentTime ? new Date(state.lastAlertSentTime).toISOString() : null,
          lastDangerLevel: state.lastDangerLevel,
          alertHistory: state.alertHistory.slice(-10), // Last 10 alerts
          isThrottled: state.lastAlertSentTime ? (Date.now() - state.lastAlertSentTime) < 60000 : false,
          timeSinceLastAlert: state.lastAlertSentTime ? Math.round((Date.now() - state.lastAlertSentTime) / 1000) : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get SMS state', details: (error as Error).message },
      { status: 500 }
    );
  }
}
