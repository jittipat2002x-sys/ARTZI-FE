'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Building2, 
  User, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { AlertModal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { BrandButton } from '@/components/ui/brand-button';
import { useBranding } from '@/contexts/branding-context';

const registerSchema = z.object({
  // Step 1: Clinic
  clinicName: z.string().min(2, 'Clinic name is too short'),
  taxId: z.string().optional(),
  clinicEmail: z.string().email('Invalid clinic email'),
  clinicPhone: z.string().optional(),
  clinicDescription: z.string().optional(),
  
  // Step 2: Owner
  ownerEmail: z.string().email('Invalid owner email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { brandColor, logoUrl: brandLogo } = useBranding();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      clinicName: '',
      clinicEmail: '',
      ownerEmail: '',
      password: '',
    },
  });

  const nextStep = async () => {
    let fields: (keyof RegisterFormValues)[] = [];
    if (step === 1) {
      fields = ['clinicName', 'clinicEmail'];
    }

    const isValid = await trigger(fields);
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await authService.registerClinic({
        ...data,
        branchName: 'Main Branch', // Default for trial
      });
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Registration failed');
      setIsErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'ข้อมูลคลินิก', icon: Building2 },
    { id: 2, title: 'ข้อมูลเจ้าของ', icon: User },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Left side: branding/image */}
      <div 
        className="hidden lg:flex lg:w-1/3 relative overflow-hidden flex-col justify-between p-12 lg:h-screen lg:sticky lg:top-0"
        style={{ backgroundColor: brandColor }}
      >
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-2xl" style={{ color: brandColor }}>P</div>
            <span className="text-white text-2xl font-bold tracking-tight">PetHeart</span>
          </Link>
          <div className="mt-20">
            <h1 className="text-4xl font-bold text-white leading-tight">
              ลงทะเบียนทดลองใช้<br />ฟรี 1 เดือน
            </h1>
            <p className="mt-4 text-white/80 text-lg">
              จัดการนัดหมาย, ประวัติการรักษา, คลังยา และการเงิน ในที่เดียว
            </p>
          </div>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 bg-gray-200" style={{ borderColor: brandColor }} />
              ))}
            </div>
            <p className="text-white text-sm font-medium">
              ร่วมกับคลินิกกว่า 500+ แห่งทั่วประเทศ
            </p>
          </div>
        </div>

        {/* Abstract background shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: brandColor }}></div>
      </div>

      {/* Right side: Form */}
      <div className="flex-1 flex flex-col justify-center py-4 px-4 sm:px-6 lg:px-20 bg-gray-50 dark:bg-gray-900 overflow-y-auto relative">
        <div className="absolute top-4 right-4 animate-in fade-in duration-500">
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((s, i) => (
                <div key={s.id} className="flex flex-col items-center flex-1 relative">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-20 ${
                      step >= s.id ? 'text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                    }`}
                    style={step >= s.id ? { backgroundColor: brandColor } : undefined}
                  >
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                    step >= s.id ? '' : 'text-gray-500 dark:text-gray-400'
                  }`} style={step >= s.id ? { color: brandColor } : undefined}>
                    {s.title}
                  </span>
                  
                  {i < steps.length - 1 && (
                    <div className="absolute top-5 left-1/2 w-full h-[2px] bg-gray-200 dark:bg-gray-800 -z-10">
                      <div 
                        className="h-full transition-all duration-500" 
                        style={{ width: step > s.id ? '100%' : '0%', backgroundColor: brandColor }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-10 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-2xl/50">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-kanit">
                {step === 1 && 'ข้อมูลคลินิกพื้นฐาน'}
                {step === 2 && 'ข้อมูลเจ้าของคลินิก'}
              </h2>
              <p className="text-gray-500 mt-1">
                {step === 1 && 'กรอกข้อมูลเบื้องต้นเพื่อเริ่มต้นใช้งานฟรี 1 เดือน'}
                {step === 2 && 'สร้างบัญชีสำหรับผู้ดูแลระบบหรือเจ้าของคลินิก'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <Input
                    label="ชื่อคลินิก"
                    required
                    {...register('clinicName')}
                    error={errors.clinicName?.message}
                    placeholder="เช่น PetHeart สหคลินิก"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="อีเมลหลัก"
                      required
                      {...register('clinicEmail')}
                      error={errors.clinicEmail?.message}
                      placeholder="contact@clinic.com"
                    />
                    <Input
                      label="เบอร์โทรศัพท์"
                      {...register('clinicPhone')}
                      error={errors.clinicPhone?.message}
                    />
                  </div>
                  <Input
                    label="เลขประจำตัวผู้เสียภาษี"
                    {...register('taxId')}
                    placeholder="13 หลัก (ถ้ามี)"
                  />
                  <Textarea
                    label="คำอธิบายคลินิก"
                    {...register('clinicDescription')}
                    rows={3}
                    placeholder="เช่น สาขาที่ให้บริการ, ความเชี่ยวชาญพิเศษ"
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="ชื่อ"
                      required
                      {...register('firstName')}
                      error={errors.firstName?.message}
                      placeholder="ชื่อ"
                    />
                    <Input
                      label="นามสกุล"
                      required
                      {...register('lastName')}
                      error={errors.lastName?.message}
                      placeholder="นามสกุล"
                    />
                  </div>
                  <Input
                    label="อีเมลผู้ใช้งาน (สำหรับล็อกอิน)"
                    required
                    {...register('ownerEmail')}
                    error={errors.ownerEmail?.message}
                    placeholder="admin@clinic.com"
                  />
                  <Input
                    label="รหัสผ่าน"
                    type="password"
                    required
                    {...register('password')}
                    error={errors.password?.message}
                    placeholder="กำหนดอย่างน้อย 6 ตัวอักษร"
                  />
                </div>
              )}

              <div className="pt-6 flex gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
                  </button>
                )}
                
                {step < 2 ? (
                  <BrandButton
                    type="button"
                    onClick={nextStep}
                    className="flex-[2] py-3 text-base"
                  >
                    ถัดไป <ChevronRight className="w-4 h-4" />
                  </BrandButton>
                ) : (
                  <BrandButton
                    type="submit"
                    loading={isLoading}
                    className="flex-[2] py-3 text-base"
                  >
                    เริ่มทดลองใช้งานฟรี <ArrowRight className="w-4 h-4" />
                  </BrandButton>
                )}
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                มีบัญชีอยู่แล้ว? 
                <Link 
                  href="/login" 
                  className="font-bold ml-1 hover:underline underline-offset-4 decoration-2 transition-colors"
                  style={{ color: brandColor }}
                >
                  เข้าสู่ระบบที่นี่
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={isSuccessModalOpen}
        onClose={() => {}} // Block closing to force redirect
        onConfirm={() => router.push('/login')}
        title="ลงทะเบียนสำเร็จ!"
        description="เริ่มทดลองใช้งานฟรีได้ทันที บัญชีของคุณพร้อมใช้งานแล้ว"
        confirmText="ไปหน้าเข้าสู่ระบบ"
        type="success"
        showCancelButton={false}
      />

      <AlertModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        onConfirm={() => setIsErrorModalOpen(false)}
        title="ลงทะเบียนไม่สำเร็จ"
        description={errorMessage}
        confirmText="ตกลง"
        type="danger"
        showCancelButton={false}
      />
    </div>
  );
}
