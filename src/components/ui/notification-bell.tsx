'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, PackageX, CalendarClock } from 'lucide-react';
import { inventoryService } from '@/services/inventory.service';
import { appointmentService } from '@/services/appointment.service';
import Link from 'next/link';
import { useBranding } from '@/contexts/branding-context';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { brandColor } = useBranding();

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      // Fetch today's appointments
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date()); // YYYY-MM-DD
      const apptsRes = await appointmentService.getAppointments(1, 100, 'SCHEDULED', 'all', today);
      if (apptsRes?.data) {
        setAppointments(apptsRes.data);
      }

      // Fetch stock alerts
      const invRes = await inventoryService.getInventories(
        'all',
        undefined,
        undefined,
        undefined,
        1,
        100,
        true // stockAlert
      );
      if (invRes?.data) {
        setLowStockItems(invRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const notificationCount = appointments.length + lowStockItems.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-gray-400 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-white transition-colors"
      >
        <Bell size={20} />
        {notificationCount > 0 && (
          <span 
            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
            style={{ backgroundColor: brandColor }}
          >
            {notificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-xl dark:bg-gray-800 z-50 overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 dark:bg-gray-800/50 dark:border-gray-700">
             <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">การแจ้งเตือน</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notificationCount === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                ไม่มีการแจ้งเตือนใหม่
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                
                {/* Appointments Section */}
                {appointments.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-xs font-semibold text-brand/80 dark:text-brand-light uppercase tracking-wider mb-1">
                      นัดหมายวันนี้ ({appointments.length})
                    </div>
                    {appointments.map((appt) => (
                      <Link
                        key={appt.id}
                        href="/dashboard/appointments"
                        className="flex items-start gap-3 rounded-lg p-2 hover:bg-brand/5 dark:hover:bg-gray-700/50 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="mt-0.5 rounded-full bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          <CalendarClock size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            นัดหมาย: {appt.pet?.name || 'ไม่ระบุชื่อ'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {appt.reason || 'ไม่มีรายละเอียด'} - เวลา {new Date(appt.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Low Stock Section */}
                {lowStockItems.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-xs font-semibold text-red-500/80 dark:text-red-400 uppercase tracking-wider mb-1">
                      แจ้งเตือนสต๊อกสินค้า ({lowStockItems.length})
                    </div>
                    {lowStockItems.map((item) => {
                      const isOutOfStock = item.quantity <= 0;
                      return (
                      <Link
                        key={item.id}
                        href="/dashboard/inventory"
                        className={`flex items-start gap-3 rounded-lg p-2 transition-colors ${
                          isOutOfStock 
                            ? 'hover:bg-red-50 dark:hover:bg-red-900/10' 
                            : 'hover:bg-orange-50 dark:hover:bg-orange-900/10'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <div className={`mt-0.5 rounded-full p-1.5 ${
                          isOutOfStock
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          <PackageX size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {item.name}
                          </p>
                          <p className={`text-xs font-medium ${
                            isOutOfStock
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-orange-600 dark:text-orange-400'
                          }`}>
                            {isOutOfStock ? `สินค้าหมด (เหลือ ${item.quantity})` : `สต๊อกต่ำ (เหลือ ${item.quantity})`}
                          </p>
                        </div>
                      </Link>
                    )})}
                  </div>
                )}
                
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
