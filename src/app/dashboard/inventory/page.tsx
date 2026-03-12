'use client';

import React, { useEffect, useState } from 'react';
import { InventoryItem, inventoryService, PRODUCT_TYPE_OPTIONS, MEDICINE_TYPE_OPTIONS } from '@/services/inventory.service';
import { branchService } from '@/services/admin.service';
import { useBranches, useAuthMe } from '@/hooks/use-global-data';
import { useBranding } from '@/contexts/branding-context';
import { useQuery } from '@tanstack/react-query';
import { BrandButton } from '@/components/ui/brand-button';
import { Plus, Edit2, Trash2, PackageSearch, Package, Building2, LayoutGrid, Pill } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AlertModal } from '@/components/ui/modal';
import { BrandInput } from '@/components/ui/brand-input';
import { Pagination } from '@/components/ui/pagination';
import { InventoryModal } from './inventory-modal';
import { DataTable, Column } from '@/components/ui/data-table';

export default function InventoryPage() {
  const { brandColor, setBranchName } = useBranding();
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [branchId, setBranchId] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [medicineType, setMedicineType] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    type: 'danger'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const { data: user } = useAuthMe();
  const { data: serverBranches = [] } = useBranches(1, 100, user?.role === 'OWNER' || user?.role === 'SAAS_ADMIN');

  const branches = React.useMemo(() => {
    if (!user) return [];
    if (user.role === 'OWNER' || user.role === 'SAAS_ADMIN') {
      return serverBranches;
    }
    return user.branches?.map((b: any) => b.branch) || [];
  }, [user, serverBranches]);

  const { data: inventoryResponse, isLoading: isInventoryLoading, refetch } = useQuery({
    queryKey: ['inventory', { branchId, type, medicineType, search, currentPage, limit }],
    queryFn: () => inventoryService.getInventories(branchId, type, medicineType, search, currentPage, limit),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (inventoryResponse) {
      const data = inventoryResponse.data || [];
      setTotalPages(inventoryResponse.meta?.lastPage || 1);
      setTotalItems(inventoryResponse.meta?.total || 0);

      // Sort: Expired first, then Near Expiry (within 90 days), then others
      const sortedData = [...data].sort((a, b) => {
        const now = new Date();
        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(now.getDate() + 90);

        const aExp = a.expirationDate ? new Date(a.expirationDate) : null;
        const bExp = b.expirationDate ? new Date(b.expirationDate) : null;

        const getStatusOrder = (exp: Date | null) => {
          if (!exp) return 3;
          if (exp < now) return 1;
          if (exp < ninetyDaysFromNow) return 2;
          return 3;
        };

        const orderA = getStatusOrder(aExp);
        const orderB = getStatusOrder(bExp);

        if (orderA !== orderB) return orderA - orderB;
        if (aExp && bExp) return aExp.getTime() - bExp.getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setInventories(sortedData);
    }
  }, [inventoryResponse]);

  const loading = isInventoryLoading;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = (item: InventoryItem) => {
    setConfirmConfig({
        isOpen: true,
        title: 'ยืนยันการลบข้อมูล',
        description: `คุณแน่ใจหรือไม่ว่าต้องการลบรายการ "${item.name}"? การกระทำนี้ไม่สามารถเรียกคืนได้`,
        type: 'danger',
        confirmText: 'ลบข้อมูล',
        onConfirm: async () => {
          try {
            await inventoryService.deleteInventory(item.id);
            refetch();
            setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          } catch (error: any) {
            console.error('Failed to delete item', error);
            setConfirmConfig(prev => ({
                ...prev,
                isOpen: true,
                title: 'ไม่สามารถลบรายการได้',
                description: error.message || 'เกิดข้อผิดพลาดในการลบรายการ',
                type: 'warning',
                confirmText: 'ตกลง',
                onConfirm: () => setConfirmConfig(p => ({ ...p, isOpen: false }))
            }));
          }
        }
    });
  };

  const PRODUCT_TYPE_MAP: Record<string, string> = {
    'MEDICINE': 'ยา',
    'VACCINE': 'วัคซีน',
    'SUPPLY': 'วัสดุสิ้นเปลือง',
    'FOOD': 'อาหารสัตว์',
    'SERVICE': 'บริการ',
    'OTHER': 'อื่นๆ',
  };

  const translateType = (item: InventoryItem) => {
    if (item.category?.nameTh) return item.category.nameTh;
    return PRODUCT_TYPE_MAP[item.type] || item.type;
  };

  const translateMedType = (item: InventoryItem) => {
    return item.masterMedicineCategory?.nameTh || '-';
  };

  const columns: Column<InventoryItem>[] = [
    {
      header: 'ชื่อรายการ',
      cell: (item) => {
        const now = new Date();
        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(now.getDate() + 90);
        const expDate = item.expirationDate ? new Date(item.expirationDate) : null;
        
        let textClass = "text-gray-900 dark:text-white";
        const isExpired = expDate && expDate < now;
        const isNearExpiry = expDate && expDate >= now && expDate < ninetyDaysFromNow;
        const isInactive = item.isActive === false;

        const badges = [];
        if (isExpired) {
          badges.push({ text: "หมดอายุ", class: "bg-red-50 text-red-600 dark:bg-red-900/20 border-red-100 dark:border-red-900/30" });
        } else if (isNearExpiry) {
          badges.push({ text: "ใกล้หมดอายุ", class: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30" });
        }
        
        if (isInactive) {
          badges.push({ text: "ปิดการใช้งาน", class: "bg-red-50 text-red-600 dark:bg-red-900/20 border-red-100 dark:border-red-900/30" });
        }

        if (isExpired || isNearExpiry) {
           textClass = isExpired ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400";
        }

        return (
          <div className="flex flex-col gap-1">
            <span className={textClass}>{item.name}</span>
            {item.barcode && <span className="text-xs text-gray-400 font-normal">{item.barcode}</span>}
            <div className="flex flex-col gap-1 mt-0.5">
              {badges.map((badge, idx) => (
                <span key={idx} className={`inline-flex w-fit px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.class}`}>
                  {badge.text}
                </span>
              ))}
            </div>
          </div>
        );
      }
    },
    {
      header: 'สาขา',
      cell: (item) => <span className="text-xs text-gray-500">{(item as any).branch?.name || '-'}</span>
    },
    {
      header: 'หมวดหมู่',
      cell: (item) => (
        <div className="flex flex-col">
          <span className="inline-flex items-center w-fit px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {translateType(item)}
          </span>
          {item.category?.nameEn && <span className="text-[10px] text-gray-400 mt-0.5">{item.category.nameEn}</span>}
        </div>
      )
    },
    {
      header: 'ประเภทยา',
      cell: (item) => (
          <div className="flex flex-col">
              <span>{translateMedType(item)}</span>
              {item.masterMedicineCategory?.nameEn && <span className="text-[10px] text-gray-400">{item.masterMedicineCategory.nameEn}</span>}
          </div>
      )
    },
    {
      header: 'จำนวนคงเหลือ',
      className: 'text-right',
      cell: (item) => item.type === 'SERVICE' ? (
        <span className="text-gray-400">-</span>
      ) : (
        <div className="flex flex-col items-end">
            <span className={item.quantity <= (item.lowStockThreshold || 10) ? 'text-amber-500 font-medium' : ''}>
              {item.quantity} {item.masterUnit?.nameTh || item.unit}
            </span>
            {item.masterUnit?.nameEn && <span className="text-[10px] text-gray-400">{item.masterUnit.nameEn}</span>}
        </div>
      )
    },
    {
      header: 'ราคาขาย',
      className: 'text-right',
      cell: (item) => `฿${item.price.toLocaleString()}`
    },
    {
      header: 'ล็อต / หมดอายุ',
      className: 'text-xs font-medium',
      cell: (item) => {
        if (item.type === 'SERVICE') return <span className="text-gray-400">-</span>;
        
        const now = new Date();
        const expDate = item.expirationDate ? new Date(item.expirationDate) : null;
        let textClass = "text-gray-900 dark:text-white";
        if (expDate && expDate < now) textClass = "text-red-600 dark:text-red-400";
        else if (expDate && expDate < new Date(now.setDate(now.getDate() + 90))) textClass = "text-amber-600 dark:text-amber-400";

        return (
          <div className="flex flex-col gap-0.5">
            {item.lotNumber && <span className="text-gray-600 dark:text-gray-400">Lot: {item.lotNumber}</span>}
            {item.expirationDate && (
              <span className={textClass}>
                EXP: {new Date(item.expirationDate).toLocaleDateString('th-TH')}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'จัดการ',
      className: 'text-right w-[100px]',
      cell: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(item)}
            className="p-1.5 transition-transform hover:scale-110 active:scale-95"
            style={{ color: brandColor }}
            title="แก้ไข"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDeleteConfirm(item)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="ลบ"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package size={28} style={{ color: brandColor }} /> คลังสินค้าและบริการ
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            จัดการข้อมูลยา, วัคซีน, สินค้า และบริการของคลินิก
          </p>
        </div>
        <BrandButton onClick={handleCreate} className="flex items-center gap-2">
          <Plus size={18} />
          เพิ่มรายการ
        </BrandButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-none border border-gray-200 dark:border-gray-700 mb-6">
        <div className="w-full">
          <label className="text-xs font-medium text-gray-500 mb-1 block">ค้นหาชื่อสินค้า/บริการ</label>
          <BrandInput
            placeholder="พิมพ์ชื่อเพื่อค้นหา..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div className="w-full">
          <label className="text-xs font-medium text-gray-500 mb-1 block">เลือกสาขา</label>
          <SearchableSelect
            options={[
              ...(user?.role === 'OWNER' || user?.role === 'SAAS_ADMIN' ? [{ id: '', name: 'ทุกสาขา' }] : []),
              ...branches
            ]}
            value={branchId}
                onChange={(val) => {
                  setBranchId(val || '');
                  setCurrentPage(1);
                  const branch = branches.find((b: any) => b.id === val);
                  setBranchName(branch?.name || null);
                }}
            placeholder="เลือกสาขา"
            icon={Building2}
          />
        </div>

        <div className="w-full">
          <label className="text-xs font-medium text-gray-500 mb-1 block">ประเภทสินค้า</label>
          <SearchableSelect
            options={[{ id: '', name: 'ทั้งหมด' }, ...PRODUCT_TYPE_OPTIONS]}
            value={type}
            onChange={(val) => {
              setType(val);
              setCurrentPage(1);
            }}
            placeholder="เลือกประเภทสินค้า"
            icon={LayoutGrid}
          />
        </div>

        <div className="w-full">
          <label className="text-xs font-medium text-gray-500 mb-1 block">ประเภทยา</label>
          <SearchableSelect
            options={[{ id: '', name: 'ทั้งหมด' }, ...MEDICINE_TYPE_OPTIONS]}
            value={medicineType}
            onChange={(val) => {
              setMedicineType(val);
              setCurrentPage(1);
            }}
            placeholder="เลือกประเภทยา"
            icon={Pill}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={inventories}
        loading={loading}
        emptyIcon={PackageSearch}
        emptyText="ยังไม่มีข้อมูลในระบบ"
        keyExtractor={(item) => item.id}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingItem}
        branchId={branchId}
        branches={branches}
        onSuccess={() => refetch()}
      />

      <AlertModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        title={confirmConfig.title}
        description={confirmConfig.description}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
}
