/**
 * DEBUG TEMPORAIRE — Test direct création Google Calendar
 * POST /api/admin/google-calendar/test-create
 *
 * Appelle createCalendarEvent avec des données bidon et retourne
 * le résultat en JSON pour diagnostiquer sans passer par send-confirmation.
 *
 * Accessible aux super-admin uniquement.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createCalendarEvent } from '@/lib/services/google-calendar';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const debugTrace: Record<string, unknown> = { step: 'start' };

  try {
    // Vérifier les env vars
    debugTrace.GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ? 'SET' : 'MISSING';
    debugTrace.GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID ? 'SET' : 'MISSING';
    debugTrace.GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET ? 'SET' : 'MISSING';

    // Vérifier le token en base
    const adminClient = createAdminClient();
    const { data: tokenData } = await adminClient
      .from('app_settings')
      .select('value')
      .eq('key', 'google_calendar_refresh_token')
      .maybeSingle();
    debugTrace.tokenInDb = tokenData?.value ? 'SET' : 'MISSING';
    debugTrace.tokenPreview = tokenData?.value
      ? String(tokenData.value).slice(0, 20) + '...'
      : null;

    // Vérifier le setting enabled
    const { data: enabledData } = await adminClient
      .from('app_settings')
      .select('value')
      .eq('key', 'google_calendar_enabled')
      .maybeSingle();
    debugTrace.enabledValue = enabledData?.value;

    // Tenter de créer un événement
    debugTrace.step = 'calling-createCalendarEvent';
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dateStr = tomorrow.toISOString().slice(0, 10);

    const result = await createCalendarEvent({
      showTitle:             'TEST DEBUG Calendar',
      guestFullName:         'Test Debug',
      guestStructure:        null,
      guestEmail:            'test@example.com',
      reservationId:         'test-debug-' + Date.now(),
      guestComment:          null,
      managerName:           null,
      managerPhone:          null,
      managerEmail:          null,
      numPlaces:             1,
      slotDate:              dateStr,
      slotTime:              '20:00',
      durationMinutes:       120,
      venueName:             'Test Venue',
      venueCity:             'Paris',
      sendEmailNotification: false,
    });

    debugTrace.step = 'finished';
    debugTrace.result = result;

    return NextResponse.json({ ok: true, debug: debugTrace });
  } catch (err) {
    debugTrace.step = 'exception';
    debugTrace.exceptionMessage = err instanceof Error ? err.message : String(err);
    debugTrace.exceptionStack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json({ ok: false, debug: debugTrace }, { status: 500 });
  }
}
