'use client';

import React, { useEffect, useState } from 'react';
import { consentService } from '@/services/consent.service';
import { FileText, Calendar, User, Eye, Download } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

interface PetConsentHistoryProps {
  petId: string;
}

export const PetConsentHistory: React.FC<PetConsentHistoryProps> = ({ petId }) => {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<any>(null);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const data = await consentService.getSignedFormsByPet(petId);
      setForms(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (petId) fetchForms();
  }, [petId]);

  if (loading) return <div className="text-center py-4 text-gray-400 text-xs">กำลังโหลดใบยินยอม...</div>;
  if (forms.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
      <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
        <FileText size={12} /> ใบยินยอมที่เซ็นแล้ว ({forms.length})
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {forms.map((form) => (
          <div key={form.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/5 rounded-lg">
                <FileText size={16} className="text-brand" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase truncate max-w-[150px]">{form.template?.name}</p>
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Calendar size={10} /> {new Date(form.createdAt).toLocaleDateString('th-TH')}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedForm(form)}
              className="p-2 text-brand hover:bg-brand/10 rounded-lg transition-colors"
            >
              <Eye size={16} />
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedForm} onClose={() => setSelectedForm(null)} className="max-w-4xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold">รายละเอียดใบยินยอมที่เซ็นแล้ว</h2>
        </div>
        {selectedForm && (
          <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh]">
            <div className="text-center space-y-2 border-b pb-6">
              <h1 className="text-2xl font-bold">{selectedForm.template?.name}</h1>
              <p className="text-sm text-gray-500">ลงวันที่ {new Date(selectedForm.createdAt).toLocaleString('th-TH')}</p>
            </div>

            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-xl border">
              {selectedForm.contentSnapshot}
            </div>

            <div className="flex justify-end pt-8">
              <div className="text-center space-y-2">
                <img src={selectedForm.signatureUrl} alt="Signature" className="max-h-24 mx-auto border-b-2 border-gray-900 px-4" />
                <p className="text-sm font-bold flex items-center justify-center gap-1">
                    <User size={14} /> ผู้ให้ความยินยอม: {selectedForm.signedBy}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
