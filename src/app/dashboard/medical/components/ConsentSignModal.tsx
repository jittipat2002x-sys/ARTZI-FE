'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { BrandButton } from '@/components/ui/brand-button';
import { SignaturePad } from '@/components/ui/signature-pad';
import { apiClient } from '@/lib/api-client';
import { consentService } from '@/services/consent.service';
import { FileText, User, Dog, ChevronLeft } from 'lucide-react';

interface ConsentSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: any;
  customer: any;
  medicalRecordId?: string;
  onSuccess?: () => void;
  onDeferSuccess?: (data: {
    templateId: string;
    signedBy: string;
    signatureBase64: string;
    contentSnapshot: string;
    templateName: string;
  }) => void;
}

export const ConsentSignModal: React.FC<ConsentSignModalProps> = ({
  isOpen,
  onClose,
  pet,
  customer,
  medicalRecordId,
  onSuccess,
  onDeferSuccess
}) => {
  const [step, setStep] = useState<'SELECT' | 'SIGN'>('SELECT');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMedicalRecordId, setSelectedMedicalRecordId] = useState<string | undefined>(medicalRecordId);
  const [signerName, setSignerName] = useState(`${customer?.firstName || ''} ${customer?.lastName || ''}`);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);

  useEffect(() => {
    setSelectedMedicalRecordId(medicalRecordId);
  }, [medicalRecordId]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      loadPetHistory();
      setStep('SELECT');
    }
  }, [isOpen]);

  const loadPetHistory = async () => {
    if (!pet?.id) return;
    try {
      const res = await apiClient.get<any[]>(`/medical-records/pet/${pet.id}`);
      setRecentRecords(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await consentService.getAllTemplates();
      setTemplates(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const processContent = (content: string) => {
    return content
      .replace(/{petName}/g, pet?.name || '---')
      .replace(/{customerName}/g, signerName || '---')
      .replace(/{date}/g, new Date().toLocaleDateString('th-TH'));
  };

  const handleSign = async (signatureBase64: string) => {
    const contentSnapshot = processContent(selectedTemplate.content);
    
    if (onDeferSuccess) {
      onDeferSuccess({
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        signedBy: signerName,
        signatureBase64,
        contentSnapshot
      });
      onClose();
      return;
    }

    try {
      setLoading(true);
      await consentService.signForm({
        templateId: selectedTemplate.id,
        petId: pet.id,
        medicalRecordId: selectedMedicalRecordId,
        signedBy: signerName,
        signatureBase64,
        contentSnapshot
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-4xl w-full">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="text-brand" /> ใบยินยอมแบบดิจิทัล
        </h2>
      </div>

      <div className="p-6">
        {step === 'SELECT' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-brand/5 border border-brand/10 rounded-lg flex items-center gap-3">
                <Dog className="text-brand" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">สัตว์เลี้ยง</p>
                  <p className="font-bold text-gray-800">{pet?.name}</p>
                </div>
              </div>
              <div className="p-3 bg-brand/5 border border-brand/10 rounded-lg flex items-center gap-3">
                <User className="text-brand" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">เจ้าของ</p>
                  <p className="font-bold text-gray-800">{customer?.firstName} {customer?.lastName}</p>
                </div>
              </div>
            </div>



            {!medicalRecordId && recentRecords.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ผูกกับรายการเข้ารักษา (Link to Visit)</label>
                <select 
                  value={selectedMedicalRecordId || ''} 
                  onChange={(e) => setSelectedMedicalRecordId(e.target.value || undefined)}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand font-medium bg-white"
                >
                  <option value="">-- ไม่ผูกกับรายการรักษา (General) --</option>
                  {recentRecords.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {new Date(r.visitDate).toLocaleDateString('th-TH')} - {r.diagnosis || 'ไม่ระบุอาการ'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">เลือกประเภทใบยินยอม</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplate(t);
                      setStep('SIGN');
                    }}
                    className="p-4 text-left border rounded-xl hover:border-brand hover:bg-brand/5 transition-all group"
                  >
                    <p className="font-bold text-gray-900 group-hover:text-brand">{t.name}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{t.content}</p>
                  </button>
                ))}
                {templates.length === 0 && !loading && (
                  <p className="col-span-full text-center py-8 text-gray-400 italic">ไม่พบเทมเพลตใบยินยอม กรุณาสร้างเทมเพลตในหน้า Admin</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <button 
              onClick={() => setStep('SELECT')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand mb-4"
            >
              <ChevronLeft size={16} /> กลับไปเลือกเทมเพลต
            </button>

            <div className="max-h-[400px] overflow-y-auto p-6 bg-gray-50 border rounded-xl prose prose-sm max-w-none">
              <h3 className="text-lg font-bold text-center mb-6">{selectedTemplate.name}</h3>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {processContent(selectedTemplate.content)}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อผู้เซ็นยินยอม</label>
                <input 
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ลงลายมือชื่อ</label>
                <SignaturePad onSave={handleSign} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
