"use client";

import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { BrandButton } from './brand-button';
import { Trash2, Check } from 'lucide-react';

interface SignaturePadProps {
  onSave: (base64: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ 
  onSave, 
  onClear,
  width = 400, // Reduced default
  height = 180 
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
    if (onClear) onClear();
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("กรุณาเซ็นชื่อก่อนบันทึก");
      return;
    }
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center p-4 border rounded-lg bg-white shadow-sm">
      <div className="border border-dashed border-gray-300 rounded overflow-hidden bg-gray-50 w-full flex justify-center">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: width,
            height: height,
            className: 'signature-canvas max-w-full h-auto touch-none'
          }}
          backgroundColor="rgba(255,255,255,0)"
        />
      </div>
      
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={clear}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <Trash2 size={16} /> ล้างลายเซ็น
        </button>
        <BrandButton
          type="button"
          onClick={save}
          className="flex items-center gap-2"
        >
          <Check size={16} /> บันทึกลายเซ็น
        </BrandButton>
      </div>
    </div>
  );
};
