import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function KhitbahRedirect({ searchParams }: { searchParams: { tab?: string } }) {
  if (searchParams?.tab === 'seserahan' || searchParams?.tab === 'rundown') {
    redirect('/tahap/proses-khitbah');
  }
  redirect('/tahap/kesepakatan-khitbah');
}
