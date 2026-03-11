'use client';

import React, { useEffect, useState } from 'react';
import { masterDataService, MasterProductCategory, MasterMedicineCategory, MasterUnit, MasterUsageInstruction } from '@/services/master-data.service';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandInput } from '@/components/ui/brand-input';
import { DataTable, Column } from '@/components/ui/data-table';
import { AlertModal, Modal } from '@/components/ui/modal';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Database, Plus, Edit2, Trash2, Pill, Package, Ruler, Clock } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import { useBranding } from '@/contexts/branding-context';

type TabType = 'PRODUCT_CAT' | 'MEDICINE_CAT' | 'UNIT' | 'USAGE';

export default function MasterDataPage() {
    const { brandColor } = useBranding();
    const [activeTab, setActiveTab] = useState<TabType>('PRODUCT_CAT');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Data states
    const [productCats, setProductCats] = useState<MasterProductCategory[]>([]);
    const [medicineCats, setMedicineCats] = useState<MasterMedicineCategory[]>([]);
    const [units, setUnits] = useState<MasterUnit[]>([]);
    const [usageInstructions, setUsageInstructions] = useState<MasterUsageInstruction[]>([]);

    // Modal states
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState<any>({
        nameTh: '',
        nameEn: '',
        medicineCategoryId: '',
        type: 'FREQUENCY',
    });

    useEffect(() => {
        const user = authService.getUser();
        if (user?.role !== 'SAAS_ADMIN') {
            router.push('/dashboard');
            return;
        }
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [p, m, u, i] = await Promise.all([
                masterDataService.getProductCategories(),
                masterDataService.getMedicineCategories(),
                masterDataService.getUnits(),
                masterDataService.getUsageInstructions(),
            ]);
            setProductCats(p);
            setMedicineCats(m);
            setUnits(u);
            setUsageInstructions(i);
        } catch (error) {
            console.error('Failed to load master data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingItem(null);
        setFormData({
            nameTh: '',
            nameEn: '',
            medicineCategoryId: '',
            type: activeTab === 'USAGE' ? 'FREQUENCY' : undefined,
        });
        setIsAddEditModalOpen(true);
    };

    const handleOpenEditModal = (item: any) => {
        setEditingItem(item);
        setFormData({
            nameTh: item.nameTh,
            nameEn: item.nameEn || '',
            medicineCategoryId: item.medicineCategoryId || '',
            type: item.type || undefined,
        });
        setIsAddEditModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { ...formData };
            if (activeTab === 'UNIT' && !data.medicineCategoryId) delete data.medicineCategoryId;

            if (editingItem) {
                if (activeTab === 'PRODUCT_CAT') await masterDataService.updateProductCategory(editingItem.id, data);
                else if (activeTab === 'MEDICINE_CAT') await masterDataService.updateMedicineCategory(editingItem.id, data);
                else if (activeTab === 'UNIT') await masterDataService.updateUnit(editingItem.id, data);
                else if (activeTab === 'USAGE') await masterDataService.updateUsageInstruction(editingItem.id, data);
            } else {
                if (activeTab === 'PRODUCT_CAT') await masterDataService.createProductCategory(data);
                else if (activeTab === 'MEDICINE_CAT') await masterDataService.createMedicineCategory(data);
                else if (activeTab === 'UNIT') await masterDataService.createUnit(data);
                else if (activeTab === 'USAGE') await masterDataService.createUsageInstruction(data);
            }
            setIsAddEditModalOpen(false);
            loadAllData();
        } catch (error) {
            console.error('Save failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        setLoading(true);
        try {
            if (activeTab === 'PRODUCT_CAT') await masterDataService.deleteProductCategory(itemToDelete.id);
            else if (activeTab === 'MEDICINE_CAT') await masterDataService.deleteMedicineCategory(itemToDelete.id);
            else if (activeTab === 'UNIT') await masterDataService.deleteUnit(itemToDelete.id);
            else if (activeTab === 'USAGE') await masterDataService.deleteUsageInstruction(itemToDelete.id);
            setIsDeleteModalOpen(false);
            loadAllData();
        } catch (error) {
            console.error('Delete failed', error);
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<any>[] = [
        { header: 'ชื่อ (ภาษาไทย)', accessorKey: 'nameTh' },
        { header: 'Name (English)', accessorKey: 'nameEn' },
        ...(activeTab === 'UNIT' ? [{ 
            header: 'ประเภทยาที่เกี่ยวข้อง', 
            cell: (item: any) => item.medicineCategory?.nameTh || 'ใช้ได้ทั้งหมด' 
        }] : []),
        ...(activeTab === 'USAGE' ? [{ 
            header: 'ประเภท', 
            cell: (item: any) => item.type === 'FREQUENCY' ? 'ความถี่' : 'เวลา' 
        }] : []),
        {
            header: 'จัดการ',
            className: 'text-right w-[100px]',
            cell: (item) => (
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleOpenEditModal(item)} className="p-1.5 text-gray-500 hover:text-brand rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true); }} className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg"><Trash2 size={16} /></button>
                </div>
            )
        }
    ];

    const tabs = [
        { id: 'PRODUCT_CAT', name: 'ประเภทสินค้า', icon: Package, data: productCats },
        { id: 'MEDICINE_CAT', name: 'ประเภทยา', icon: Pill, data: medicineCats },
        { id: 'UNIT', name: 'หน่วยนับ', icon: Ruler, data: units },
        { id: 'USAGE', name: 'วิธีใช้ยา', icon: Clock, data: usageInstructions },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Database className="h-7 w-7" style={{ color: brandColor }} /> จัดการข้อมูลหลัก (Master Data)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">ตั้งค่าชื่อไทย-อังกฤษ และตัวเลือกต่างๆ สำหรับระบบคลังยา</p>
                </div>
                <BrandButton onClick={handleOpenAddModal} className="flex items-center gap-2">
                    <Plus size={18} /> เพิ่มรายการ
                </BrandButton>
            </div>

            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all"
                        style={activeTab === tab.id 
                                ? { backgroundColor: 'white', color: brandColor, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }
                                : { color: '#6B7280' }
                        }
                    >
                        <tab.icon size={16} />
                        {tab.name}
                    </button>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={tabs.find(t => t.id === activeTab)?.data || []}
                loading={loading}
                keyExtractor={(item) => item.id}
            />

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isAddEditModalOpen}
                onClose={() => setIsAddEditModalOpen(false)}
            >
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">{editingItem ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                    <BrandInput 
                        label="ชื่อ (ภาษาไทย)" 
                        required 
                        value={formData.nameTh} 
                        onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })} 
                    />
                    <BrandInput 
                        label="Name (English)" 
                        value={formData.nameEn} 
                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} 
                    />

                    {activeTab === 'UNIT' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ประเภทยาที่เกี่ยวข้อง (ถ้ามี)</label>
                            <SearchableSelect
                                options={[{ id: '', name: 'ใช้ได้ทั้งหมด' }, ...medicineCats.map(m => ({ id: m.id, name: m.nameTh }))]}
                                value={formData.medicineCategoryId}
                                onChange={(val) => setFormData({ ...formData, medicineCategoryId: val })}
                                placeholder="เลือกประเภทยา"
                                icon={Pill}
                            />
                        </div>
                    )}

                    {activeTab === 'USAGE' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ประเภทข้อมูล</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={formData.type === 'FREQUENCY'} onChange={() => setFormData({ ...formData, type: 'FREQUENCY' })} />
                                    <span className="text-sm">ความถี่ (Frequency)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={formData.type === 'TIME'} onChange={() => setFormData({ ...formData, type: 'TIME' })} />
                                    <span className="text-sm">เวลาทาน (Time)</span>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        <button type="button" onClick={() => setIsAddEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400">ยกเลิก</button>
                        <BrandButton type="submit" loading={loading}>บันทึกข้อมูล</BrandButton>
                    </div>
                </form>
            </div>
            </Modal>

            {/* Delete Modal */}
            <AlertModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="ยืนยันการลบ"
                description={`คุณแน่ใจหรือไม่ว่าต้องการลบ "${itemToDelete?.nameTh}"?`}
                type="danger"
                confirmText="ลบข้อมูล"
                onConfirm={handleDelete}
            />
        </div>
    );
}
