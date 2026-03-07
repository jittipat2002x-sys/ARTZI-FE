'use client';

import React, { useEffect, useState } from 'react';
import { InventoryItem, inventoryService, PRODUCT_TYPE_OPTIONS, MEDICINE_TYPE_OPTIONS } from '@/services/inventory.service';
import { authService } from '@/services/auth.service';
import { branchService } from '@/services/admin.service';
import { BrandButton } from '@/components/ui/brand-button';
import { Plus, Edit2, Trash2, PackageSearch, Building2, LayoutGrid, Pill } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AlertModal } from '@/components/ui/modal';
import { BrandInput } from '@/components/ui/brand-input';
import { Pagination } from '@/components/ui/pagination';
import { InventoryModal } from './inventory-modal';
import { DataTable, Column } from '@/components/ui/data-table';

export default function InventoryPage() {
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [medicineType, setMedicineType] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
    
    const fetchData = async () => {
      // In our system, owners can see everything, staff see their branch
      if (currentUser?.role === 'OWNER' || currentUser?.role === 'SAAS_ADMIN') {
        try {
          const b = await branchService.getAll();
          setBranches(Array.isArray(b.data) ? b.data : (Array.isArray(b) ? b : []));
        } catch (e) {
          console.error('Failed to fetch branches', e);
        }
      } else {
        const staffBranches = currentUser?.branches?.map((b: any) => b.branch) || [];
        setBranches(staffBranches);
      }
      
      // Set default branch if only one, otherwise empty means "All" for owners
      const staffBranches = currentUser?.branches?.map((b: any) => b.branch) || [];
      if (staffBranches.length === 1 && (currentUser?.role !== 'OWNER' && currentUser?.role !== 'SAAS_ADMIN')) {
        const bId = staffBranches[0].id;
        setBranchId(bId);
        loadInventories(1, bId);
      } else {
        loadInventories(1, ''); // Load all for this tenant
      }
    };

    fetchData();
  }, []);

  const loadInventories = async (
    page: number = currentPage,
    bId: string = branchId,
    t: string = type,
    mt: string = medicineType,
    s: string = search
  ) => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventories(bId, t, mt, s, page, limit);
      const data = response.data || [];
      setTotalPages(response.meta?.lastPage || 1);
      setTotalItems(response.meta?.total || 0);

      // Sort: Expired first, then Near Expiry (within 90 days), then others
      const sortedData = [...data].sort((a, b) => {
        const now = new Date();
        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(now.getDate() + 90);

        const aExp = a.expirationDate ? new Date(a.expirationDate) : null;
        const bExp = b.expirationDate ? new Date(b.expirationDate) : null;

        const getStatusOrder = (exp: Date | null) => {
          if (!exp) return 3; // Normal
          if (exp < now) return 1; // Expired
          if (exp < ninetyDaysFromNow) return 2; // Near expiry
          return 3; // Normal
        };

        const orderA = getStatusOrder(aExp);
        const orderB = getStatusOrder(bExp);

        if (orderA !== orderB) return orderA - orderB;
        
        // If same status, sort by expiry date (sooner first) if applicable
        if (aExp && bExp) return aExp.getTime() - bExp.getTime();
        
        // Final fallback to newest first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setInventories(sortedData);
    } catch (error) {
      console.error('Failed to load inventories', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadInventories(page);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await inventoryService.deleteInventory(itemToDelete.id);
      loadInventories(currentPage);
    } catch (error) {
      console.error('Failed to delete item', error);
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
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
        let badgeText = "";
        let badgeClass = "";
        
        if (expDate) {
          if (expDate < now) {
            textClass = "text-red-600 dark:text-red-400";
            badgeText = "หมดอายุ";
            badgeClass = "bg-red-100 text-red-700 dark:bg-red-900/30";
          } else if (expDate < ninetyDaysFromNow) {
            textClass = "text-amber-600 dark:text-amber-400";
            badgeText = "ใกล้หมดอายุ";
            badgeClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/30";
          }
        }

        return (
          <div className="flex flex-col">
            <span className={textClass}>{item.name}</span>
            {item.barcode && <span className="text-xs text-gray-400 font-normal mt-0.5">{item.barcode}</span>}
            {badgeText && (
              <span className={`inline-flex w-fit mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${badgeClass}`}>
                {badgeText}
              </span>
            )}
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
            className="p-1.5 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
            title="แก้ไข"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => {
              setItemToDelete(item);
              setIsDeleteModalOpen(true);
            }}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">คลังสินค้าและบริการ</h1>
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
              loadInventories(1, branchId, type, medicineType, e.target.value);
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
              setBranchId(val);
              setCurrentPage(1);
              loadInventories(1, val, type, medicineType, search);
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
              loadInventories(1, branchId, val, medicineType, search);
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
              loadInventories(1, branchId, type, val, search);
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
        onSuccess={() => loadInventories(currentPage)}
      />

      <AlertModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="ยืนยันการลบข้อมูล"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบรายการ "${itemToDelete?.name}"? การกระทำนี้ไม่สามารถเรียกคืนได้`}
        type="danger"
        confirmText="ลบข้อมูล"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
