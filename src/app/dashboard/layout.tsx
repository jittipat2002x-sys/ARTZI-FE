'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { Alert } from '@/components/ui/alert';
import { authService } from '@/services/auth.service';
import Link from 'next/link';
import { Menu, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { NotificationBell } from '@/components/ui/notification-bell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setUser(authService.getUser());
  }, []);

  const isGracePeriod = user?.subscriptionStatus === 'grace_period';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar - Desktop and Mobile */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
            >
              <Menu size={24} />
            </button>
            
            {/* Context breadcrumb or page title could go here */}
            <div className="hidden items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 md:flex">
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme}
              className="rounded-full p-2 text-gray-400 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-yellow-400 transition-colors"
              title={theme === 'dark' ? 'สลับเป็น Light Mode' : 'สลับเป็น Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <NotificationBell />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {isGracePeriod && (
            <div className="px-4 pt-4 lg:px-8">
              <Alert 
                variant="warning" 
                title="ช่วงผ่อนผัน"
                action={
                  <Link 
                    href="/dashboard/settings/subscription"
                    className="inline-flex items-center bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm"
                  >
                    ต่ออายุการใช้งานเลย
                  </Link>
                }
              >
                บัญชีของคุณหมดอายุแล้ว แต่ยังสามารถใช้งานได้อีก{' '}
                <span className="font-bold">{user.daysRemaining} วัน</span>{' '}
                กรุณาต่ออายุการใช้งานก่อนบัญชีจะถูกระงับ
              </Alert>
            </div>
          )}
          
          <main className="p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
