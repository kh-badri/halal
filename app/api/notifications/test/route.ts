import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Simulasi sinyal push server berhasil dijalankan di mode development.',
  });
}
