'use client';

import React, { useEffect, useState, use } from 'react';
import { roleService, menuService } from '@/services/admin.service';
import { Input } from '@/components/ui/input';
import { BrandButton } from '@/components/ui/brand-button';
import { ChevronRight, ChevronsRight, ChevronLeft, ChevronsLeft, Search, ArrowLeft, Save, Menu as MenuIcon, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RoleMenusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roleId } = use(params);
  const router = useRouter();
  const [role, setRole] = useState<any>(null);
  const [allMenus, setAllMenus] = useState<any[]>([]);
  const [assignedMenuIds, setAssignedMenuIds] = useState<string[]>([]);
  const [leftSelected, setLeftSelected] = useState<string[]>([]);
  const [rightSelected, setRightSelected] = useState<string[]>([]);
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roleData, menusData, assignedMenus] = await Promise.all([
          roleService.getById(roleId),
          menuService.getAllFlat(),
          roleService.getMenus(roleId),
        ]);
        setRole(roleData);
        setAllMenus(menusData);
        setAssignedMenuIds(assignedMenus.map((m: any) => m.id));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [roleId]);

  // Available (left) = all menus NOT in assigned
  const availableMenus = allMenus.filter(m => !assignedMenuIds.includes(m.id));
  const assignedMenus = allMenus.filter(m => assignedMenuIds.includes(m.id));

  const filteredAvailable = availableMenus.filter(m => m.name.toLowerCase().includes(leftSearch.toLowerCase()));
  const filteredAssigned = assignedMenus.filter(m => m.name.toLowerCase().includes(rightSearch.toLowerCase()));

  // Move selected left -> right
  const moveRight = () => {
    setAssignedMenuIds(prev => [...prev, ...leftSelected]);
    setLeftSelected([]);
  };

  // Move all left -> right
  const moveAllRight = () => {
    setAssignedMenuIds(prev => [...prev, ...availableMenus.map(m => m.id)]);
    setLeftSelected([]);
  };

  // Move selected right -> left
  const moveLeft = () => {
    setAssignedMenuIds(prev => prev.filter(id => !rightSelected.includes(id)));
    setRightSelected([]);
  };

  // Move all right -> left
  const moveAllLeft = () => {
    setAssignedMenuIds([]);
    setRightSelected([]);
  };

  const toggleLeftSelect = (id: string) => {
    setLeftSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleRightSelect = (id: string) => {
    setRightSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleLeftAll = () => {
    if (leftSelected.length === filteredAvailable.length) {
      setLeftSelected([]);
    } else {
      setLeftSelected(filteredAvailable.map(m => m.id));
    }
  };

  const toggleRightAll = () => {
    if (rightSelected.length === filteredAssigned.length) {
      setRightSelected([]);
    } else {
      setRightSelected(filteredAssigned.map(m => m.id));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await roleService.assignMenus(roleId, assignedMenuIds);
      router.push('/dashboard/roles');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><p className="text-gray-500">กำลังโหลด...</p></div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">จัดการสิทธิ์เมนูของกลุ่ม</h1>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><FolderOpen className="h-4 w-4" /> กลุ่ม: <strong className="text-gray-900 dark:text-white">{role?.name}</strong></span>
          <span className="flex items-center gap-1"><MenuIcon className="h-4 w-4" /> เมนูที่มีสิทธิ์: <strong className="text-gray-900 dark:text-white">{assignedMenuIds.length} รายการ</strong></span>
        </div>
      </div>

      {/* Dual-list Transfer */}
      <div className="flex gap-4 items-stretch">
        {/* Left Panel — Available Menus */}
        <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">เมนูที่สามารถเพิ่มได้</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">แสดง {filteredAvailable.length} จาก {availableMenus.length} รายการ</p>
            <div className="mt-3">
              <Input
                icon={Search}
                placeholder="ค้นหาเมนู..."
                value={leftSearch}
                onChange={e => setLeftSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Select All */}
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={leftSelected.length === filteredAvailable.length && filteredAvailable.length > 0}
                onChange={toggleLeftAll}
                className="rounded border-gray-300 text-brand focus:ring-brand"
              />
              เลือกทั้งหมด
            </label>
          </div>

          {/* Menu List */}
          <div className="overflow-y-auto max-h-80">
            {filteredAvailable.map(menu => (
              <label key={menu.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-50 dark:border-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={leftSelected.includes(menu.id)}
                  onChange={() => toggleLeftSelect(menu.id)}
                  className="rounded border-gray-300 text-brand focus:ring-brand"
                />
                <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <MenuIcon className="h-4 w-4 text-brand" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{menu.name}</span>
                <span className="ml-auto text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-800">Active</span>
              </label>
            ))}
            {filteredAvailable.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">ไม่มีเมนูที่สามารถเพิ่มได้</div>
            )}
          </div>
        </div>

        {/* Center Buttons */}
        <div className="flex flex-col items-center justify-center gap-2 py-4">
          <button onClick={moveRight} disabled={leftSelected.length === 0} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button onClick={moveAllRight} disabled={availableMenus.length === 0} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronsRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button onClick={moveLeft} disabled={rightSelected.length === 0} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button onClick={moveAllLeft} disabled={assignedMenus.length === 0} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronsLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Right Panel — Assigned Menus */}
        <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">เมนูที่มีสิทธิ์ (Authorized)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ทั้งหมด {assignedMenus.length} รายการ</p>
            <div className="mt-3">
              <Input
                icon={Search}
                placeholder="ค้นหาเมนู..."
                value={rightSearch}
                onChange={e => setRightSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Select All */}
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={rightSelected.length === filteredAssigned.length && filteredAssigned.length > 0}
                onChange={toggleRightAll}
                className="rounded border-gray-300 text-brand focus:ring-brand"
              />
              เลือกทั้งหมด
            </label>
          </div>

          {/* Menu List */}
          <div className="overflow-y-auto max-h-80">
            {filteredAssigned.map(menu => (
              <label key={menu.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-50 dark:border-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={rightSelected.includes(menu.id)}
                  onChange={() => toggleRightSelect(menu.id)}
                  className="rounded border-gray-300 text-brand focus:ring-brand"
                />
                <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <MenuIcon className="h-4 w-4 text-brand" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{menu.name}</span>
              </label>
            ))}
            {filteredAssigned.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                <div className="h-12 w-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <MenuIcon className="h-6 w-6 text-gray-300 dark:text-gray-500" />
                </div>
                ยังไม่มีเมนูที่กำหนด
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => router.push('/dashboard/roles')}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> ยกเลิก
        </button>
        <BrandButton
          onClick={handleSave}
          disabled={saving}
          size="lg"
        >
          <Save className="h-4 w-4" /> {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
        </BrandButton>
      </div>
    </div>
  );
}
