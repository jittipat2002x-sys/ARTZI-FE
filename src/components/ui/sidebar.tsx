'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Shield,
  Menu as MenuIcon,
  ChevronRight, 
  ChevronDown,
  Calendar,
  FileText,
  BarChart3,
  Package,
  Receipt,
  LogOut,
  Building2,
  MapPin,
  X,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authService } from '@/services/auth.service';
import { useBranding } from '@/contexts/branding-context';
import { useRouter } from 'next/navigation';
import { AlertModal } from '@/components/ui/modal';
import { useAuthMe, useMenus } from '@/hooks/use-global-data';
import { useQueryClient } from '@tanstack/react-query';

// Map icon name strings from DB to actual Lucide icons
const iconMap: Record<string, any> = {
  LayoutDashboard,
  Users,
  Shield,
  Menu: MenuIcon,
  Calendar,
  FileText,
  BarChart3,
  Package,
  Receipt,
  Building2,
  MapPin,
  Palette,
};

interface ApiMenu {
  id: string;
  name: string;
  path: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: ApiMenu[];
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { logoUrl: brandingLogo, brandColor } = useBranding();
  const { data: user } = useAuthMe();
  const { data: menus = [] } = useMenus();

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title) 
        : [...prev, title]
    );
  };

  const handleLogout = () => {
    authService.logout();
    queryClient.clear();
    router.push('/login');
  };

  // Render a menu item (supports children)
  const renderMenuItem = (menu: ApiMenu) => {
    const IconComponent = menu.icon ? iconMap[menu.icon] || LayoutDashboard : LayoutDashboard;
    const hasChildren = menu.children && menu.children.length > 0;
    const isActive = pathname === menu.path;
    const isExpanded = expandedItems.includes(menu.name);

    return (
      <div key={menu.id} className="space-y-1">
        {menu.path && !hasChildren ? (
          <Link
            href={menu.path}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive 
                ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white" 
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <IconComponent className={cn(
              "mr-3 h-5 w-5 flex-shrink-0",
              !isActive && "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300"
            )} style={isActive ? { color: brandColor } : undefined} />
            {menu.name}
          </Link>
        ) : (
          <button
            onClick={() => toggleExpand(menu.name)}
            className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <IconComponent className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
            <span className="flex-1 text-left">{menu.name}</span>
            {hasChildren && (
              isExpanded ? <ChevronDown className="ml-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />
            )}
          </button>
        )}

        {hasChildren && isExpanded && (
          <div className="ml-8 mt-1 space-y-1">
            {menu.children?.map((child) => (
              <Link
                key={child.id}
                href={child.path || '#'}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === child.path
                    ? "text-brand font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600/50 dark:bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ease-in-out lg:static lg:block lg:translate-x-0 lg:shadow-sm h-full",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="flex h-20 items-center px-6 gap-3 border-b border-gray-50 dark:border-gray-700 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="relative h-10 w-10 flex-shrink-0">
              {brandingLogo ? (
                <img src={brandingLogo} alt="Logo" className="h-10 w-10 object-contain" />
              ) : (
                <Image
                  src="/img/image__1_-removebg-preview.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                />
              )}
            </Link>
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
                {user?.branchName || user?.tenantName || 'PetHeart'}
              </h2>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                {user?.roleDescription || user?.role?.replace('_', ' ') || 'User'}
              </span>
            </div>
          </div>
          
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

      {/* Navigation Section — Dynamic from API */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menus.length > 0 ? (
          menus.map(renderMenuItem)
        ) : (
          <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">กำลังโหลดเมนู...</p>
        )}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: brandColor + '15', borderColor: brandColor + '30', borderWidth: 1 }}>
              <span className="font-bold text-sm" style={{ color: brandColor }}>
                {user?.firstName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="ml-3 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="ออกจากระบบ"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      </div>

      {/* Logout Confirmation Modal - Moved outside transformed div */}
      <AlertModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="ออกจากระบบ"
        description="คุณต้องการออกจากระบบใช่หรือไม่?"
        confirmText="ใช่, ออกจากระบบ"
        cancelText="ยกเลิก"
        type="danger"
      />
    </>
  );
}
