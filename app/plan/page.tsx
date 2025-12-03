'use client';

import { useAuthSession } from '@/hooks/useAuthSession';
import Dashboard from '@/components/plan/Dashboard';

export default function PlanPage() {
  const { session, loading } = useAuthSession();

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900"
        suppressHydrationWarning
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return <Dashboard session={session} />;
}
