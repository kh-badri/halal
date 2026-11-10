'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KhitbahRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/tahap/kesepakatan-khitbah');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
      <div className="w-10 h-10 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
    </div>
  );
}
