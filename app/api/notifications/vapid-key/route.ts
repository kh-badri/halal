import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Return the public VAPID key
  const publicKey = 'BFTzhhucJWKyCrbzPtAVnCcQVNVQa_qKkc7TEEFymtGXEK4SE-FwQM1d1It4u2qu3CjbYZkkq9xE1TiDjrL9WMg';
  return NextResponse.json({ publicKey });
}
