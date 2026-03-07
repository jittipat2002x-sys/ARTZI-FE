'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const userData = authService.getUser();
    if (!userData) {
      router.push('/login');
      return;
    }

    setUser(userData);
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  if (!user) {
    return <div className="min-h-screen flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg">
      <main>
        <div className="max-w-7xl mx-auto">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg h-96 p-4 flex flex-col justify-center items-center">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Welcome, {user.firstName}!</h2>
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-4 py-2 rounded-full font-medium shadow-sm">
                Role: {user.role}
              </div>
              {user.role === 'SAAS_ADMIN' && (
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-center max-w-lg">
                  As a Super Admin, you have full access to manage all tenants, users, and global configurations across the system.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
