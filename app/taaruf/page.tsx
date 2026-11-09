import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function TaarufRedirect({ searchParams }: { searchParams: { tab?: string } }) {
  if (searchParams?.tab === 'qa') {
    redirect('/tahap/proses-taaruf');
  }
  redirect('/tahap/persetujuan-taaruf');
}
