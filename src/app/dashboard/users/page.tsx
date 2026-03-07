'use client';

import React, { useEffect, useState, useRef } from 'react';
import { userManagementService, roleService, branchService } from '@/services/admin.service';
import { authService } from '@/services/auth.service';
import { Modal, AlertModal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { BrandInput } from '@/components/ui/brand-input';
import { Input } from '@/components/ui/input';
import { BrandButton } from '@/components/ui/brand-button';
import { useBranding } from '@/contexts/branding-context';
import { Plus, Pencil, Trash2, Search, Users, ChevronDown, Building2, X, Hospital } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function UsersPage() {
  const { brandColor } = useBranding();
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roles, setRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [clinicDropdownOpen, setClinicDropdownOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState('');
  const [clinicSearch, setClinicSearch] = useState('');
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const clinicDropdownRef = useRef<HTMLDivElement>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', roleId: '', branchIds: [] as string[] });

  const currentUser = authService.getUser();
  const isSaasAdmin = currentUser?.role === 'SAAS_ADMIN';

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      // Fetch users with pagination and search
      const response = await userManagementService.getAll(page, 10, search, selectedBranchId, selectedClinicId);
      setUsers(response.data || []);
      setTotalPages(response.meta?.lastPage || 1);
      setTotalUsers(response.meta?.total || 0);
      setCurrentPage(page);

      // Fetch roles and branches once (or we can skip if already fetched)
      if (roles.length === 0 || branches.length === 0) {
        const [r, b] = await Promise.all([
          roleService.getAll(1, 100), // Get potentially all roles
          branchService.getAll()
        ]);
        setRoles(Array.isArray(r.data) ? r.data : (Array.isArray(r) ? r : []));
        setBranches(Array.isArray(b.data) ? b.data : (Array.isArray(b) ? b : []));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const timer = setTimeout(() => {
      fetchData(1); 
    }, 500);
    return () => clearTimeout(timer);
  }, [search, selectedBranchId, selectedClinicId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
      }
      if (clinicDropdownRef.current && !clinicDropdownRef.current.contains(e.target as Node)) {
        setClinicDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Unique clinics from users for SAAS_ADMIN filter
  const clinics = isSaasAdmin
    ? Array.from(
        new Map(
          users.filter(u => u.tenant).map(u => [u.tenant.id, { id: u.tenant.id, name: u.tenant.name }])
        ).values()
      ).sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const selectedClinic = clinics.find(c => c.id === selectedClinicId);
  const filteredClinicOptions = clinics.filter(c =>
    c.name?.toLowerCase().includes(clinicSearch.toLowerCase())
  );

  const selectedBranch = branches.find((b: any) => b.id === selectedBranchId);
  const filteredBranchOptions = branches.filter((b: any) =>
    b.name?.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const filtered = users; // Filtering now happens on the backend

  const handleCreate = async () => {
    try {
      await userManagementService.create(form);
      setShowCreateModal(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', roleId: '', branchIds: [] });
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };
 
  const handleUpdate = async () => {
    if (!editUser) return;
    try {
      const data: any = {};
      if (form.firstName) data.firstName = form.firstName;
      if (form.lastName) data.lastName = form.lastName;
      if (form.email) data.email = form.email;
      if (form.roleId) data.roleId = form.roleId;
      if (form.password) data.password = form.password;
      if (form.branchIds) data.branchIds = form.branchIds;
      await userManagementService.update(editUser.id, data);
      setEditUser(null);
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    await userManagementService.delete(deleteUser.id);
    setDeleteUser(null);
    fetchData();
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setForm({ 
      email: user.email, 
      password: '', 
      firstName: user.firstName, 
      lastName: user.lastName, 
      roleId: user.roleId || '',
      branchIds: user.branches?.map((b: any) => b.branchId) || []
    });
  };
 
  if (loading) return <div className="flex justify-center items-center h-64"><p className="text-gray-500">กำลังโหลด...</p></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-7 w-7" style={{ color: brandColor }} /> จัดการผู้ใช้
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            ทั้งหมด {totalUsers} คน
            {selectedClinic && <span className="ml-1 text-purple-600 dark:text-purple-400">• คลินิก: {selectedClinic.name}</span>}
            {selectedBranch && <span className="ml-1" style={{ color: brandColor }}>• สาขา: {selectedBranch.name}</span>}
          </p>
        </div>
        <BrandButton
          onClick={() => { setShowCreateModal(true); setForm({ email: '', password: '', firstName: '', lastName: '', roleId: '', branchIds: [] }); }}
          size="lg"
        >
           <Plus className="h-4 w-4" /> เพิ่มผู้ใช้
        </BrandButton>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="ค้นหาผู้ใช้..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Clinic Filter Dropdown (SAAS_ADMIN only) */}
        {isSaasAdmin && clinics.length > 0 && (
          <div className="w-64">
            <SearchableSelect
              options={[{ id: '', name: 'ทุกคลินิก' }, ...clinics]}
              value={selectedClinicId}
              onChange={(val) => setSelectedClinicId(val)}
              placeholder="เลือกคลินิก"
              icon={Hospital}
              className={selectedClinicId ? 'ring-2 ring-purple-500/10' : ''}
            />
          </div>
        )}

        {/* Branch Filter Dropdown */}
        {branches.length > 0 && (
          <div className="w-64">
            <SearchableSelect
              options={[{ id: '', name: 'ทุกสาขา' }, ...branches]}
              value={selectedBranchId}
              onChange={(val) => setSelectedBranchId(val)}
              placeholder="เลือกสาขา"
              icon={Building2}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ชื่อ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">อีเมล</th>
              {isSaasAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">คลินิก/โรงพยาบาล</th>}
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"> Role</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">สาขา</th>
               <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: brandColor + '15', borderColor: brandColor + '30', borderWidth: 1 }}>
                      <span className="font-bold text-sm" style={{ color: brandColor }}>{user.firstName?.charAt(0)}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                {isSaasAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.tenant ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-900/30 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-800">
                        <Hospital className="h-3 w-3" />
                        {user.tenant.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                    )}
                  </td>
                )}
                 <td className="px-6 py-4 whitespace-nowrap">
                   <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800">
                     {user.roleRef?.description || user.roleRef?.name || '-'}
                   </span>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex flex-wrap gap-1">
                     {user.branches?.length > 0 ? (
                       user.branches.map((b: any) => (
                         <span key={b.branchId} className="inline-flex items-center rounded bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                           {b.branch?.name}
                         </span>
                       ))
                     ) : (
                       <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                     )}
                   </div>
                 </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button onClick={() => openEdit(user)} className="text-gray-400 dark:text-gray-500 hover:text-brand mr-3 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteUser(user)} className="text-gray-400 dark:text-gray-500 hover:text-red-600 transition-colors">
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
            onPageChange={(page) => fetchData(page)}
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">เพิ่มผู้ใช้ใหม่</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <BrandInput 
                label="ชื่อ"
                placeholder="ชื่อ" 
                value={form.firstName} 
                onChange={e => setForm({...form, firstName: e.target.value})} 
              />
              <BrandInput 
                label="นามสกุล"
                placeholder="นามสกุล" 
                value={form.lastName} 
                onChange={e => setForm({...form, lastName: e.target.value})} 
              />
            </div>
            <BrandInput 
              label="อีเมล"
              placeholder="อีเมล" 
              type="email" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
            />
            <BrandInput 
              label="รหัสผ่าน"
              placeholder="รหัสผ่าน" 
              type="password" 
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
            />
            <select 
              value={form.roleId} 
              onChange={e => setForm({...form, roleId: e.target.value})} 
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
            >
              <option value="">เลือก Role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name} - {r.description || ''}</option>)}
            </select>

            {/* Branch Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">เลือกสาขา</label>
            <SearchableSelect
                multiple
                options={branches}
                value={form.branchIds}
                onChange={(ids) => setForm({ ...form, branchIds: ids })}
                placeholder="เลือกสาขาที่ดูแล..."
                icon={Building2}
              />
            </div>
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
        isOpen={!!editUser} 
        onClose={() => setEditUser(null)}
        className="sm:max-w-md"
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">แก้ไขผู้ใช้</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <BrandInput 
                label="ชื่อ"
                placeholder="ชื่อ" 
                value={form.firstName} 
                onChange={e => setForm({...form, firstName: e.target.value})} 
              />
              <BrandInput 
                label="นามสกุล"
                placeholder="นามสกุล" 
                value={form.lastName} 
                onChange={e => setForm({...form, lastName: e.target.value})} 
              />
            </div>
            <BrandInput 
              label="อีเมล"
              placeholder="อีเมล" 
              type="email" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
            />
            <BrandInput 
              label="รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)"
              placeholder="รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" 
              type="password" 
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
            />
            <select 
              value={form.roleId} 
              onChange={e => setForm({...form, roleId: e.target.value})} 
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
            >
              <option value="">เลือก Role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name} - {r.description || ''}</option>)}
            </select>

            {/* Branch Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">เลือกสาขา</label>
            <SearchableSelect
                multiple
                options={branches}
                value={form.branchIds}
                onChange={(ids) => setForm({ ...form, branchIds: ids })}
                placeholder="เลือกสาขาที่ดูแล..."
                icon={Building2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button 
              onClick={() => setEditUser(null)} 
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
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="ลบผู้ใช้"
        description={`คุณต้องการลบผู้ใช้ "${deleteUser?.firstName} ${deleteUser?.lastName}" ใช่หรือไม่?`}
        confirmText="ลบ"
        cancelText="ยกเลิก"
        type="danger"
      />
    </div>
  );
}
