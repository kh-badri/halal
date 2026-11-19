import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Development mockup response for Next.js dev server
  return NextResponse.json({
    success: true,
    notifications: [
      {
        id: 'dev_1',
        type: 'answer',
        title: '💌 Jawaban dari Calon Pasangan',
        body: 'Calon pasangan telah mengirimkan jawaban pada pertanyaan ta\'aruf.',
        url: '/tahap/proses-taaruf',
        targetRole: 'pria',
        senderRole: 'wanita',
        senderName: 'Calon Pasangan',
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    ],
    unreadCount: 1,
    total: 1,
  });
}
