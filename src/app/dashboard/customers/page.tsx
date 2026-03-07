'use client';

import React, { useState, useEffect } from 'react';
import { customerService, Customer, Pet } from '@/services/customer.service';
import { petService } from '@/services/pet.service';
import { BrandButton } from '@/components/ui/brand-button';
import { useBranding } from '@/contexts/branding-context';
import { DataTable, Column } from '@/components/ui/data-table';
import { ThaiDateInput } from '@/components/ui/thai-date-input';
import { BrandInput } from '@/components/ui/brand-input';
import {
  Users,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  UserPlus,
  SearchIcon,
  Dog,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Info,
  MessageCircle,
  X,
  AlertCircle,
  Stethoscope
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Pagination } from '@/components/ui/pagination';
import { authService } from '@/services/auth.service';
import { AlertModal } from '@/components/ui/modal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { VisitPanel } from './components/VisitPanel';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PetFormData {
  id?: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  birthDate: string;
  color: string;
  weight: number;
  tagId: string;
}

const emptyPet: PetFormData = {
  name: '',
  species: 'สุนัข',
  breed: '',
  sex: 'M',
  birthDate: '',
  color: '',
  weight: 0,
  tagId: ''
};

export default function CustomerPage() {
  const [user, setUser] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { brandColor } = useBranding();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // Registration Form State
  const [regMode, setRegMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    lineId: '',
    address: ''
  });
  const [petsData, setPetsData] = useState<PetFormData[]>([{ ...emptyPet }]);
  const [petFormErrors, setPetFormErrors] = useState<Record<string, string>>({});
  const [expandedPetIndex, setExpandedPetIndex] = useState<number | null>(0);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info',
    onConfirm: () => {},
  });

  const [expandedVisitCustomerId, setExpandedVisitCustomerId] = useState<string | null>(null);

  const loadCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const branchId = selectedBranchId === 'all' ? undefined : selectedBranchId;
      const response = await customerService.getCustomers(page, 10, search, branchId);
      setCustomers(response.data);
      setTotalPages(response.meta.lastPage);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load customers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
    // Default to the first branch if available, but keep 'all' as an option
    // Actually, user might want to see 'this branch' by default as per request.
    if (currentUser?.branches && currentUser.branches.length > 0 && selectedBranchId === 'all') {
      // If we want to default to current branch:
      // setSelectedBranchId(currentUser.branches[0].branchId);
    }
  }, []);

  useEffect(() => {
    loadCustomers(currentPage);
  }, [currentPage, search, selectedBranchId]);

  const addPet = () => {
    const newIndex = petsData.length;
    setPetsData([...petsData, { ...emptyPet }]);
    setExpandedPetIndex(newIndex);
  };

  const removePet = async (index: number) => {
    if (petsData.length <= 1) return;
    const pet = petsData[index];
    // If the pet has an id, delete it from the backend
    if (pet.id) {
      try {
        await petService.deletePet(pet.id);
      } catch (error) {
        console.error('Failed to delete pet', error);
      }
    }
    setPetsData(petsData.filter((_, i) => i !== index));
    if (expandedPetIndex === index) {
      setExpandedPetIndex(null);
    } else if (expandedPetIndex !== null && expandedPetIndex > index) {
      setExpandedPetIndex(expandedPetIndex - 1);
    }
  };

  const updatePet = (index: number, field: keyof PetFormData, value: string | number) => {
    const updated = [...petsData];
    updated[index] = { ...updated[index], [field]: value };
    setPetsData(updated);
  };

  const doSave = async () => {
    if (!user?.tenantId) return;

    try {
      let finalCustomerId = selectedCustomerId;

      if (editingCustomerId) {
        // UPDATE existing customer
        const payload: any = {
          firstName: customerData.firstName,
          lastName: customerData.lastName,
        };
        payload.phone = customerData.phone || null;
        payload.email = customerData.email || null;
        payload.lineId = customerData.lineId || null;
        payload.address = customerData.address || null;

        await customerService.updateCustomer(editingCustomerId, payload);
      } else if (regMode === 'NEW') {
        // CREATE new customer
        const payload: any = {
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          tenantId: user.tenantId,
          branchId: user.branches?.[0]?.branchId // Auto-fill with user's first branch
        };
        if (customerData.phone) payload.phone = customerData.phone;
        if (customerData.email) payload.email = customerData.email;
        if (customerData.lineId) payload.lineId = customerData.lineId;
        if (customerData.address) payload.address = customerData.address;

        const newCustomer = await customerService.createCustomer(payload);
        finalCustomerId = newCustomer.id;
      }

      // Handle pets
      if (editingCustomerId) {
        // In edit mode: update existing pets, create new pets
        for (const pet of petsData) {
          if (!pet.name) continue;
          const petPayload: any = {
            name: pet.name,
            species: pet.species,
          };
          if (pet.breed) petPayload.breed = pet.breed;
          if (pet.sex) petPayload.sex = pet.sex;
          if (pet.birthDate) petPayload.birthDate = pet.birthDate;
          if (pet.color) petPayload.color = pet.color;
          if (pet.weight) petPayload.weight = pet.weight;
          if (pet.tagId) petPayload.tagId = pet.tagId;

          if (pet.id) {
            // Update existing pet, fallback to create if not found
            try {
              await petService.updatePet(pet.id, petPayload);
            } catch {
              // Pet might have been deleted, re-create it
              petPayload.tenantId = user.tenantId;
              petPayload.customerId = editingCustomerId;
              await petService.createPet(petPayload);
            }
          } else {
            // Create new pet
            petPayload.tenantId = user.tenantId;
            petPayload.customerId = editingCustomerId;
            await petService.createPet(petPayload);
          }
        }
      } else {
        // New registration: create all pets
        const custId = finalCustomerId;
        for (const pet of petsData) {
          if (pet.name) {
            const petPayload: any = {
              name: pet.name,
              species: pet.species,
              tenantId: user.tenantId,
              customerId: custId,
              branchId: user.branches?.[0]?.branchId // Auto-fill with user's first branch
            };
            if (pet.breed) petPayload.breed = pet.breed;
            if (pet.sex) petPayload.sex = pet.sex;
            if (pet.birthDate) petPayload.birthDate = pet.birthDate;
            if (pet.color) petPayload.color = pet.color;
            if (pet.weight) petPayload.weight = pet.weight;
            if (pet.tagId) petPayload.tagId = pet.tagId;
            await petService.createPet(petPayload);
          }
        }
      }

      // Success
      setIsFormOpen(false);
      resetForm();
      loadCustomers(currentPage);

      setAlertModal({
        isOpen: true,
        title: 'บันทึกสำเร็จ',
        description: 'ข้อมูลลูกค้าและสัตว์เลี้ยงถูกบันทึกเรียบร้อยแล้ว',
        type: 'success',
        onConfirm: () => setAlertModal(prev => ({ ...prev, isOpen: false })),
        confirmText: 'ตกลง'
      });
    } catch (error) {
      console.error('Registration failed', error);
      setAlertModal({
        isOpen: true,
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        type: 'danger',
        onConfirm: () => setAlertModal(prev => ({ ...prev, isOpen: false })),
        confirmText: 'ตกลง'
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;

    if (editingCustomerId) {
      // Show confirmation before updating
      setAlertModal({
        isOpen: true,
        title: 'ยืนยันการอัปเดต',
        description: `ต้องการอัปเดตข้อมูลลูกค้า "${customerData.firstName} ${customerData.lastName}" ใช่หรือไม่?`,
        type: 'warning',
        onConfirm: () => {
          setAlertModal(prev => ({ ...prev, isOpen: false }));
          doSave();
        },
        confirmText: 'ยืนยันอัปเดต'
      });
    } else {
      // Create mode: save directly
      doSave();
    }
  };

  const resetForm = () => {
    setCustomerData({ firstName: '', lastName: '', phone: '', email: '', lineId: '', address: '' });
    setPetsData([{ ...emptyPet }]);
    setSelectedCustomerId('');
    setEditingCustomerId(null);
    setRegMode('NEW');
    setExpandedPetIndex(0);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setExpandedVisitCustomerId(null); // Close visit panel if open
    setExpandedPetIndex(null); // Collapse all pets when opening edit form
    setCustomerData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone || '',
      email: customer.email || '',
      lineId: customer.lineId || '',
      address: customer.address || ''
    });
    // Load existing pets into the form
    if (customer.pets && customer.pets.length > 0) {
      setPetsData(customer.pets.map(pet => ({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed || '',
        sex: pet.sex || 'M',
        birthDate: pet.birthDate ? pet.birthDate.split('T')[0] : '',
        color: pet.color || '',
        weight: pet.weight || 0,
        tagId: (pet as any).tagId || ''
      })));
    } else {
      setPetsData([{ ...emptyPet }]);
    }
    setRegMode('NEW');
    setIsFormOpen(false); // Close top form if open
  };

  const cancelEdit = () => {
    setEditingCustomerId(null);
    resetForm();
  };

  const handleDelete = async (customer: Customer) => {
    setAlertModal({
      isOpen: true,
      title: 'ยืนยันการลบลูกค้า',
      description: `คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลลูกค้า "${customer.firstName} ${customer.lastName}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await customerService.deleteCustomer(customer.id);
          setAlertModal(prev => ({ ...prev, isOpen: false }));
          loadCustomers(currentPage);
        } catch (error) {
          console.error('Delete failed', error);
          setAlertModal({
            isOpen: true,
            title: 'เกิดข้อผิดพลาด',
            description: 'ไม่สามารถลบข้อมูลลูกค้าได้ กรุณาลองใหม่อีกครั้ง',
            type: 'danger',
            onConfirm: () => setAlertModal(prev => ({ ...prev, isOpen: false })),
            confirmText: 'ตกลง'
          });
        }
      },
      confirmText: 'ลบข้อมูล'
    });
  };

  const columns: Column<Customer>[] = [
    {
      header: 'ลูกค้า',
      cell: (customer) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ color: brandColor, backgroundColor: brandColor + '15' }}
          >
            {customer.firstName[0]}
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white">
              {customer.firstName} {customer.lastName}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
              {customer.phone && <span className="flex items-center gap-1"><Phone size={12} /> {customer.phone}</span>}
              {customer.email && <span className="flex items-center gap-1"><Mail size={12} /> {customer.email}</span>}
              {customer.lineId && <span className="flex items-center gap-1"><MessageCircle size={12} style={{ color: brandColor }} /> {customer.lineId}</span>}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'สาขา',
      cell: (customer) => (
        <div className="flex">
          {(customer as any).branch ? (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: brandColor + '15', color: brandColor }}
            >
              <MapPin size={12} />
              {(customer as any).branch.name}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">-</span>
          )}
        </div>
      )
    },
    {
      header: 'สัตว์เลี้ยง',
      cell: (customer) => (
        <div className="flex flex-wrap gap-2">
          {customer.pets && customer.pets.length > 0 ? (
            customer.pets.map(pet => (
              <div
                key={pet.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border"
                style={{
                  color: brandColor,
                  backgroundColor: brandColor + '10',
                  borderColor: brandColor + '20'
                }}
              >
                <Dog size={12} />
                <span>{pet.name}</span>
                <span className="opacity-50 text-[10px]">({pet.species})</span>
              </div>
            ))
          ) : (
            <span className="text-gray-400 text-xs italic">ยังไม่มีข้อมูลสัตว์เลี้ยง</span>
          )}
        </div>
      )
    },
    {
      header: 'จัดการ',
      className: 'text-right w-[140px]',
      cell: (customer) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setExpandedVisitCustomerId(prev => prev === customer.id ? null : customer.id);
              setEditingCustomerId(null);
              setIsFormOpen(false);
            }}
            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            title="สร้างรายการเข้ารักษา"
          >
            <Stethoscope size={16} />
          </button>
          <button
            onClick={() => handleEdit(customer)}
            className="p-1.5 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
            title="แก้ไข"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(customer)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="ลบ"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const renderForm = () => (
    <div className={cn(
      "overflow-hidden transition-all duration-500 ease-in-out bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-none",
      isFormOpen || editingCustomerId ? "opacity-100 relative p-8" : "max-h-0 opacity-0 p-0",
      !editingCustomerId && isFormOpen ? "mb-6" : ""
    )}>
      <div
        className="flex items-center justify-between mb-6"
        style={{ color: brandColor }}
      >
        <div className="flex items-center gap-2">
          <UserPlus size={20} />
          <h2 className="text-lg font-bold">{editingCustomerId ? 'แก้ไขข้อมูลลูกค้า' : 'แบบฟอร์มลงทะเบียน'}</h2>
        </div>
        {editingCustomerId && (
          <button
            type="button"
            onClick={cancelEdit}
            className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
          >
            ยกเลิกการแก้ไข
          </button>
        )}
      </div>

      {!editingCustomerId && (
        <div className="flex gap-4 mb-8 p-1 bg-gray-50 dark:bg-gray-900 w-fit rounded-xl">
          <button
            onClick={() => setRegMode('NEW')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all",
              regMode === 'NEW' ? "bg-white dark:bg-gray-800 shadow-sm font-bold" : "text-gray-500 hover:text-gray-700"
            )}
            style={regMode === 'NEW' ? { color: brandColor } : {}}
          >
            ลูกค้าใหม่
          </button>
          <button
            onClick={() => setRegMode('EXISTING')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all",
              regMode === 'EXISTING' ? "bg-white dark:bg-gray-800 shadow-sm font-bold" : "text-gray-500 hover:text-gray-700"
            )}
            style={regMode === 'EXISTING' ? { color: brandColor } : {}}
          >
            ลูกค้าเดิม
          </button>
        </div>
      )}

        <form
          onSubmit={handleRegister}
          className="space-y-8"
          style={{
            '--brand-color': brandColor,
          } as React.CSSProperties}
        >
          {/* Branding styles for select elements (inputs use BrandInput component) */}
          <style dangerouslySetInnerHTML={{__html: `
            form select {
              border-color: ${brandColor}40 !important;
            }
            form select:hover {
              border-color: ${brandColor} !important;
            }
            form select:focus {
              --tw-ring-color: ${brandColor} !important;
              border-color: ${brandColor} !important;
            }
          `}} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Customer Section */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Info size={14} /> ข้อมูลลูกค้า
              </h3>

              {!editingCustomerId && regMode === 'EXISTING' ? (
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ค้นหาลูกค้าเดิม</label>
                  <SearchableSelect
                    options={customers.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName} (${c.phone || '-'})` }))}
                    value={selectedCustomerId}
                    onChange={(val) => setSelectedCustomerId(val)}
                    placeholder="ค้นหาด้วยชื่อหรือเบอร์โทร..."
                    icon={SearchIcon}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <BrandInput
                    label="ชื่อ"
                    required
                    type="text"
                    value={customerData.firstName}
                    onChange={e => setCustomerData({...customerData, firstName: e.target.value})}
                    placeholder="สมชาย"
                  />
                  <BrandInput
                    label="นามสกุล"
                    required
                    type="text"
                    value={customerData.lastName}
                    onChange={e => setCustomerData({...customerData, lastName: e.target.value})}
                    placeholder="รักสัตว์"
                  />
                  <BrandInput
                    label="เบอร์โทรศัพท์"
                    type="tel"
                    value={customerData.phone}
                    onChange={e => setCustomerData({...customerData, phone: e.target.value})}
                    placeholder="081-234-5678"
                  />
                  <BrandInput
                    label="อีเมล"
                    type="email"
                    value={customerData.email}
                    onChange={e => setCustomerData({...customerData, email: e.target.value})}
                    placeholder="example@email.com"
                  />
                  <BrandInput
                    label="LINE ID"
                    type="text"
                    value={customerData.lineId}
                    onChange={e => setCustomerData({...customerData, lineId: e.target.value})}
                    placeholder="@line_id"
                  />
                  <BrandInput
                    label="ที่อยู่"
                    type="text"
                    value={customerData.address}
                    onChange={e => setCustomerData({...customerData, address: e.target.value})}
                    placeholder="ที่อยู่ลูกค้า"
                  />
                </div>
              )}
            </div>

            {/* Pet Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Dog size={16} /> ข้อมูลสัตว์เลี้ยง ({petsData.length} ตัว)
                </h3>
                <button
                  type="button"
                  onClick={addPet}
                  className="flex items-center gap-1 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: brandColor }}
                >
                  <Plus size={16} /> เพิ่มสัตว์เลี้ยง
                </button>
              </div>
              <div className="space-y-4">
                {petsData.map((pet, index) => {
                  const isExpanded = expandedPetIndex === index;
                  return (
                  <div key={index} className="relative bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-none transition-all duration-300">

                    {/* Accordion Header */}
                    <div
                      onClick={() => setExpandedPetIndex(isExpanded ? null : index)}
                      className={cn(
                        "flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-none",
                        isExpanded ? "bg-gray-50/80 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" : ""
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                          style={{ backgroundColor: `${brandColor}1A`, color: brandColor }} // 1A is ~10% opacity in hex
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {pet.name ? pet.name : <span className="text-gray-400 italic">สัตว์เลี้ยงใหม่ {index > 0 ? `(ตัวที่ ${index + 1})` : ''}</span>}
                          </p>
                          <p
                            className="text-xs flex items-center gap-1 mt-0.5"
                            style={{ color: brandColor }}
                          >
                            <Dog size={10} /> {pet.species} {pet.breed ? ` • ${pet.breed}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Remove button (only if not expanded and more than 1 pet exists) */}
                        {!isExpanded && petsData.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePet(index);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all border border-transparent hover:border-red-100"
                            title="ลบสัตว์เลี้ยงตัวนี้"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <div className="p-1 text-gray-400">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>

                    {/* Accordion Body */}
                    <div className={cn(
                      "transition-all duration-500 ease-in-out origin-top overflow-hidden",
                      isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                    )}>
                      <div className="p-5 bg-gray-50/30 dark:bg-gray-900/50">
                        {/* Remove button (when expanded) */}
                        {petsData.length > 1 && (
                          <div className="flex justify-end mb-4">
                            <button
                              type="button"
                              onClick={() => removePet(index)}
                              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <X size={14} /> ลบสัตว์เลี้ยงข้อมูลนี้
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <BrandInput
                              label="ชื่อสัตว์เลี้ยง"
                              required={index === 0}
                              type="text"
                              value={pet.name}
                              onChange={e => updatePet(index, 'name', e.target.value)}
                              placeholder="เช่น ปุยฝ้าย, ด่าง"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ชนิดสัตว์ <span className="text-red-500">*</span></label>
                            <select
                              value={pet.species}
                              onChange={e => updatePet(index, 'species', e.target.value)}
                              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none dark:text-white shadow-none"
                            >
                              <option value="สุนัข">สุนัข</option>
                              <option value="แมว">แมว</option>
                              <option value="นก">นก</option>
                              <option value="กระต่าย">กระต่าย</option>
                              <option value="อื่นๆ">อื่นๆ</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">เพศ</label>
                            <select
                              value={pet.sex}
                              onChange={e => updatePet(index, 'sex', e.target.value)}
                              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none dark:text-white shadow-none"
                            >
                              <option value="M">ผู้ (Male)</option>
                              <option value="F">เมีย (Female)</option>
                              <option value="N">ทำหมัน (Neutered)</option>
                              <option value="S">ทำหมัน/ตัวเมีย (Spayed)</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <BrandInput
                              label="สายพันธุ์"
                              type="text"
                              value={pet.breed}
                              onChange={e => updatePet(index, 'breed', e.target.value)}
                              placeholder="เช่น พุดเดิ้ล, เปอร์เซีย"
                            />
                          </div>
                          <BrandInput
                            label="น้ำหนัก (กก.)"
                            type="number"
                            step="0.1"
                            value={pet.weight || ''}
                            onChange={e => updatePet(index, 'weight', e.target.value ? parseFloat(e.target.value) : 0)}
                            placeholder="0.0"
                          />
                          <BrandInput
                            label="สี"
                            type="text"
                            value={pet.color}
                            onChange={e => updatePet(index, 'color', e.target.value)}
                            placeholder="เช่น ขาว, ดำ, ส้ม"
                          />
                          <div className="col-span-2">
                            <BrandInput
                              label="Tag ID / Microchip"
                              type="text"
                              value={pet.tagId}
                              onChange={e => updatePet(index, 'tagId', e.target.value)}
                              placeholder="หมายเลข Tag หรือ Microchip"
                            />
                          </div>
                          <div className="space-y-2 col-span-2 ">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">วันเกิด</label>
                            <ThaiDateInput
                              value={pet.birthDate}
                              onChange={val => updatePet(index, 'birthDate', val)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                if (editingCustomerId) {
                  cancelEdit();
                } else {
                  setIsFormOpen(false);
                }
              }}
              className="px-6 py-3 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all font-medium"
            >
              ยกเลิก
            </button>
            <BrandButton type="submit" className="rounded-xl px-12 py-3 shadow-lg shadow-brand/20">
              {editingCustomerId ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
            </BrandButton>
          </div>
        </form>
      </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">จัดการลูกค้าและสัตว์เลี้ยง</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ลงทะเบียนและค้นหาประวัติลูกค้า
          </p>
        </div>
        <BrandButton
          onClick={() => {
            if (editingCustomerId) {
              setEditingCustomerId(null);
              resetForm();
              setIsFormOpen(true);
            } else if (isFormOpen) {
              setIsFormOpen(false);
            } else {
              resetForm();
              setIsFormOpen(true);
            }
            setExpandedVisitCustomerId(null); // Close visit panel when opening main form
          }}
          className="flex items-center gap-2"
        >
          {isFormOpen && !editingCustomerId ? <ChevronUp size={18} /> : <Plus size={18} />}
          {isFormOpen && !editingCustomerId ? 'ปิดหน้าต่าง' : 'เพิ่มข้อมูลลูกค้า'}
        </BrandButton>
      </div>

      {/* Render top form only if NOT editing (creates new customer) */}
      {!editingCustomerId && isFormOpen && renderForm()}

      {/* Main List Section */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-none border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 mb-1 block">ค้นหาลูกค้าหรือเบอร์โทร</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="พิมพ์ชื่อหรือเบอร์โทรเพื่อค้นหา..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none dark:text-gray-300 transition-all custom-search-input"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            .custom-search-input:focus {
              --tw-ring-color: ${brandColor} !important;
              border-color: ${brandColor} !important;
            }
          `}} />
        </div>

        <div className="w-full lg:w-72">
          <label className="text-xs font-medium text-gray-500 mb-1 block">กรองตามสาขา</label>
          <SearchableSelect
            options={[
              { id: 'all', name: 'ทุกสาขา' },
              ...(user?.branches?.map((bs: any) => ({
                id: bs.branchId,
                name: bs.branch?.name || 'สาขาปัจจุบัน'
              })) || [])
            ]}
            value={selectedBranchId}
            onChange={(val) => setSelectedBranchId(val)}
            placeholder="เลือกสาขา..."
            icon={MapPin}
          />
        </div>
      </div>

        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          emptyIcon={Users}
          emptyText="ไม่มีข้อมูลลูกค้า"
          keyExtractor={(c) => c.id}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          expandedRowId={expandedVisitCustomerId || editingCustomerId}
          renderExpandedRow={(customer) => (
            expandedVisitCustomerId === customer.id ? (
              <VisitPanel 
                customer={customer} 
                onClose={() => setExpandedVisitCustomerId(null)} 
              />
            ) : editingCustomerId === customer.id ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/80 rounded-b-xl border-x border-b border-gray-200 dark:border-gray-700">
                {renderForm()}
              </div>
            ) : null
          )}
          />
      
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        description={alertModal.description}
        type={alertModal.type}
        onConfirm={alertModal.onConfirm}
        confirmText={alertModal.confirmText}
      />
    </div>
  );
}
