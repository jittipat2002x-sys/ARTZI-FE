'use client';

import React, { useEffect, useState } from 'react';
import { roleService } from '@/services/admin.service';
import { Modal, AlertModal } from '@/components/ui/modal';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandInput } from '@/components/ui/brand-input';
import { Pagination } from '@/components/ui/pagination';
import { Plus, Pencil, Trash2, Shield, Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useBranding } from '@/contexts/branding-context';

export default function RolesPage() {
  const { brandColor } = useBranding();
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([]);
  const [totalRoles, setTotalRoles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editRole, setEditRole] = useState<any>(null);
  const [deleteRole, setDeleteRole] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchRoles = async (page = 1) => {
    setLoading(true);
    try {
      const response = await roleService.getAll(page);
      setRoles(response.data || []);
      setTotalPages(response.meta?.lastPage || 1);
      setTotalRoles(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleCreate = async () => {
    try {
      await roleService.create(form);
      setShowCreateModal(false);
      setForm({ name: '', description: '' });
      fetchRoles();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpdate = async () => {
    if (!editRole) return;
    try {
      await roleService.update(editRole.id, form);
      setEditRole(null);
      fetchRoles();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteRole) return;
    await roleService.delete(deleteRole.id);
    setDeleteRole(null);
    fetchRoles();
  };

  if (loading) return <div className="flex justify-center items-center h-64"><p className="text-gray-500">กำลังโหลด...</p></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-7 w-7 text-brand" /> จัดการ Role
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ทั้งหมด {totalRoles} Role</p>
        </div>
        <BrandButton
          onClick={() => { setShowCreateModal(true); setForm({ name: '', description: '' }); }}
          size="lg"
        >
          <Plus className="h-4 w-4" /> สร้าง Role
        </BrandButton>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ชื่อ Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">คำอธิบาย</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ผู้ใช้</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">เมนู</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">
                    {role.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{role.description || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">{role._count?.users || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">{role._count?.menus || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => router.push(`/dashboard/roles/${role.id}/menus`)}
                    className="text-gray-400 dark:text-gray-500 hover:text-brand mr-3 transition-colors"
                    title="จัดการเมนู"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setEditRole(role); setForm({ name: role.name, description: role.description || '' }); }}
                    className="mr-3 transition-transform hover:scale-110 active:scale-95"
                    style={{ color: brandColor }}
                    title="แก้ไข Role"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteRole(role)} className="text-gray-400 dark:text-gray-500 hover:text-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => fetchRoles(page)}
          />
        </div>
      )}

      {/* Create Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        className="sm:max-w-md"
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">สร้าง Role ใหม่</h2>
          <div className="space-y-3">
            <BrandInput 
              label="ชื่อ Role"
              placeholder="เช่น VET" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
            />
            <BrandInput 
              label="คำอธิบาย"
              placeholder="รายละเอียด" 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button 
              onClick={() => setShowCreateModal(false)} 
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              ยกเลิก
            </button>
            <BrandButton onClick={handleCreate}>
              บันทึก
            </BrandButton>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        isOpen={!!editRole} 
        onClose={() => setEditRole(null)}
        className="sm:max-w-md"
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">แก้ไข Role</h2>
          <div className="space-y-3">
            <BrandInput 
              label="ชื่อ Role"
              placeholder="ชื่อ Role" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
            />
            <BrandInput 
              label="คำอธิบาย"
              placeholder="คำอธิบาย" 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button 
              onClick={() => setEditRole(null)} 
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              ยกเลิก
            </button>
            <BrandButton onClick={handleUpdate}>
              บันทึก
            </BrandButton>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <AlertModal
        isOpen={!!deleteRole}
        onClose={() => setDeleteRole(null)}
        onConfirm={handleDelete}
        title="ลบ Role"
        description={`คุณต้องการลบ Role "${deleteRole?.name}" ใช่หรือไม่?`}
        confirmText="ลบ"
        cancelText="ยกเลิก"
        type="danger"
      />
    </div>
  );
}
