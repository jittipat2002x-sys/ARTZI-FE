'use client';

import React, { useEffect, useState } from 'react';
import { branchService } from '@/services/admin.service';
import { Plus, Pencil, Trash2, MapPin, Phone, Building, Search } from 'lucide-react';
import { Modal, AlertModal } from '@/components/ui/modal';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandInput } from '@/components/ui/brand-input';
import { BrandTextarea } from '@/components/ui/brand-textarea';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { useBranding } from '@/contexts/branding-context';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [totalBranches, setTotalBranches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editBranch, setEditBranch] = useState<any>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const { brandColor } = useBranding();

  const fetchBranches = async (page = 1) => {
    setLoading(true);
    try {
      const response = await branchService.getAll(page, 9, search); // 9 per page for 3-col grid
      setBranches(response.data || []);
      setTotalPages(response.meta?.lastPage || 1);
      setTotalBranches(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBranches(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editBranch) {
        await branchService.update(editBranch.id, form);
      } else {
        await branchService.create(form);
      }
      setShowModal(false);
      setEditBranch(null);
      setForm({ name: '', address: '', phone: '' });
      fetchBranches();
    } catch (e: any) { alert(e.message); }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await branchService.delete(deleteId);
      fetchBranches();
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (e: any) { alert(e.message); }
  };

  const openEdit = (branch: any) => {
    setEditBranch(branch);
    setForm({ name: branch.name, address: branch.address || '', phone: branch.phone || '' });
    setShowModal(true);
  };

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building className="h-8 w-8" style={{ color: brandColor }} /> จัดการสาขาของคลินิก
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">คุณสามารถเพิ่มหรือแก้ไขข้อมูลสาขาที่เปิดให้บริการได้ที่นี่</p>
        </div>
        <BrandButton
          onClick={() => { setShowModal(true); setEditBranch(null); setForm({ name: '', address: '', phone: '' }); }}
          size="lg"
        >
          <Plus className="h-4 w-4" /> เพิ่มสาขา
        </BrandButton>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="ค้นหาชื่อสาขา หรือที่อยู่..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent sm:text-sm transition-all shadow-sm"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">พบทั้งหมด {totalBranches} สาขา</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <div key={branch.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{branch.name}</h3>
              <div className="flex gap-1">
                <button onClick={() => openEdit(branch)} className="p-2 text-gray-400 dark:text-gray-400 hover:text-brand dark:hover:text-emerald-400 transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => confirmDelete(branch.id)} className="p-2 text-gray-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <MapPin className="h-4 w-4 mt-0.5 text-gray-400 dark:text-gray-400" />
                <span>{branch.address || 'ไม่ระบุที่อยู่'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Phone className="h-4 w-4 text-gray-400 dark:text-gray-400" />
                <span>{branch.phone || 'ไม่ระบุเบอร์โทรศัพท์'}</span>
              </div>
            </div>
          </div>
        ))}
        {branches.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            ยังไม่มีข้อมูลสาขา
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => fetchBranches(page)}
          />
        </div>
      )}

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        showCloseButton={false}
        className="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="overflow-hidden">
          <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 dark:bg-emerald-500/10 sm:mx-0 sm:h-10 sm:w-10">
                <Building className="h-6 w-6" style={{ color: brandColor }} aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white" id="modal-title">
                  {editBranch ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}
                </h3>
                <div className="mt-4 space-y-4 text-left">
                  <BrandInput
                    label="ชื่อสาขา *"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="เช่น สาขาลาดพร้าว"
                  />
                  <BrandTextarea
                    label="ที่อยู่"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล..."
                  />
                  <BrandInput
                    label="เบอร์โทรศัพท์"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="08x-xxx-xxxx"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
            <BrandButton
              onClick={handleSubmit}
              className="w-full justify-center sm:w-auto"
            >
              {editBranch ? 'บันทึก' : 'สร้างสาขา'}
            </BrandButton>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto transition-colors focus:outline-none"
              onClick={() => setShowModal(false)}
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </Modal>

      <AlertModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteId(null); }}
        onConfirm={handleDelete}
        title="ยืนยันการลบสาขานี้?"
        description="คุณต้องการลบสาขานี้ใช่หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้ และข้อมูลที่เกี่ยวข้องอาจถูกลบออกไป"
        confirmText="ตกลง (OK)"
        cancelText="ยกเลิก (Cancel)"
        type="danger"
      />
    </div>
  );
}
