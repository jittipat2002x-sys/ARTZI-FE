'use client';

import React, { useEffect, useState } from 'react';
import { consentService } from '@/services/consent.service';
import { FileText, Plus, Edit2, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandTextarea } from '@/components/ui/brand-textarea';
import { BrandInput } from '@/components/ui/brand-input';
import { useBranding } from '@/contexts/branding-context';

export default function ConsentTemplatesPage() {
  const { brandColor } = useBranding();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await consentService.getAllTemplates();
      setTemplates(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenModal = (template: any = null) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({ name: template.name, content: template.content });
    } else {
      setSelectedTemplate(null);
      setFormData({ name: '', content: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedTemplate) {
        await consentService.updateTemplate(selectedTemplate.id, formData);
      } else {
        await consentService.createTemplate(formData);
      }
      setIsModalOpen(false);
      fetchTemplates();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (template: any) => {
    try {
      await consentService.updateTemplate(template.id, { isActive: !template.isActive });
      fetchTemplates();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filtered = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 p-7 rounded-lg">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-8 w-8 text-brand" /> จัดการฟอร์มใบยินยอม
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">สร้างและแก้ไขเทมเพลตใบยินยอมสำหรับการรักษาและผ่าตัด</p>
        </div>
        <BrandButton onClick={() => handleOpenModal()} className="flex gap-2 items-center">
          <Plus size={18} /> สร้างเทมเพลตใหม่
        </BrandButton>
      </div>

      <div className="mb-6">
        <Input
          icon={Search}
          placeholder="ค้นหาชื่อเทมเพลต..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((template) => (
          <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {template.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{template.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-3 mb-4">{template.content}</p>
            </div>
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={() => handleOpenModal(template)}
                className="flex-1 flex gap-2 items-center justify-center py-2 text-sm font-bold rounded-lg transition-transform hover:scale-105 active:scale-95"
                style={{ color: brandColor, backgroundColor: brandColor + '08' }}
              >
                <Edit2 size={14} /> แก้ไข
              </button>
              <button 
                onClick={() => toggleStatus(template)}
                className={`p-2 rounded-lg border flex items-center justify-center ${template.isActive ? 'text-amber-600 border-amber-100 bg-amber-50' : 'text-green-600 border-green-100 bg-green-50'}`}
                title={template.isActive ? 'สั่งปิดใช้งาน' : 'สั่งเปิดใช้งาน'}
              >
                {template.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
            ไม่พบข้อมูลเทมเพลต
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        className="max-w-4xl"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold">{selectedTemplate ? 'แก้ไขเทมเพลต' : 'สร้างเทมเพลตใหม่'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อเทมเพลต</label>
            <BrandInput 
              required
              placeholder="เช่น ใบยินยอมการผ่าตัดและวางยาสลบ"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">เนื้อหาใบยินยอม</label>
            <BrandTextarea 
              required
              rows={15}
              placeholder="รายละเอียดข้อตกลงและความเสี่ยงต่างๆ..."
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
            <p className="mt-2 text-[10px] text-gray-400">
              * สามารถใช้ Placeholder เช่น {"{petName}"}, {"{customerName}"} (จะพัฒนาระบบรองรับอัตโนมัติในลำดับถัดไป)
            </p>
          </div>
          
          <div className="flex gap-3 pt-6">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
            >
              ยกเลิก
            </button>
            <BrandButton 
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </BrandButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
