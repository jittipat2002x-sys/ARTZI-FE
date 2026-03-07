'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { Github } from 'lucide-react';
import { AlertModal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { BrandButton } from '@/components/ui/brand-button';
import { useBranding, DEFAULT_BRAND_COLOR } from '@/contexts/branding-context';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const { brandColor, logoUrl: brandLogo, updateBranding } = useBranding();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email: data.email, password: data.password });
      
      // Update branding immediately if available in login response
      updateBranding(
        response.user.brandColor || DEFAULT_BRAND_COLOR,
        response.user.logoUrl || null
      );

      router.push('/dashboard');
    } catch (err: any) {
      const message = err.message || 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side: Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white dark:bg-gray-900 overflow-y-auto relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="relative h-32 w-32">
                <Image
                  src={brandLogo || "/img/image__1_-removebg-preview.png"}
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white font-kanit">
              เข้าสู่ระบบเพื่อใช้งานระบบ
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              ยังไม่มีบัญชี?{' '}
              <Link 
                href="/register" 
                className="font-semibold hover:opacity-80"
                style={{ color: brandColor }}
              >
                สมัครใช้งานคลินิกใหม่ที่นี่
              </Link>
            </p>
          </div>

          <div className="mt-10">
            {error && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <Alert 
                  variant="error" 
                  title="เข้าสู่ระบบไม่สำเร็จ"
                  action={
                    error.includes('หมดอายุ') && (
                      <div className="flex flex-wrap gap-2">
                        <Link 
                          href="/renew"
                          className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
                        >
                          เลือกแผนและต่ออายุเลย
                        </Link>
                        <Link 
                          href="https://line.me/ti/p/@youradmin" 
                          target="_blank"
                          className="inline-flex items-center bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors shadow-sm"
                        >
                          ติดต่อเจ้าหน้าที่
                        </Link>
                      </div>
                    )
                  }
                >
                  {error}
                </Alert>
              </div>
            )}
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="อีเมล"
                  id="email"
                  type="email"
                  required
                  {...register('email')}
                  error={errors.email?.message}
                  placeholder="name@example.com"
                  style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                />

                <Input
                  label="รหัสผ่าน"
                  id="password"
                  type="password"
                  required
                  {...register('password')}
                  error={errors.password?.message}
                  placeholder="••••••••"
                  style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      {...register('rememberMe')}
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded bg-transparent border-gray-300 dark:border-gray-600 focus:ring-brand"
                      style={{ accentColor: brandColor }}
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-3 block text-sm leading-6 text-gray-700 dark:text-gray-300"
                    >
                      จดจำฉัน
                    </label>
                  </div>

                  <div className="text-sm leading-6">
                    <Link
                      href="#"
                      className="font-semibold hover:opacity-80 transition-opacity"
                      style={{ color: brandColor }}
                    >
                      ลืมรหัสผ่าน?
                    </Link>
                  </div>
                </div>

                <div>
                  <BrandButton
                    type="submit"
                    loading={isLoading}
                    className="w-full"
                  >
                    เข้าสู่ระบบ
                  </BrandButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Image */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <Image
          className="absolute inset-0 h-full w-full object-cover"
          src="/img/view-cats-dogs-showing-friendship.jpg"
          alt="Login Background"
          fill
          priority
        />
        {/* Demo Button overlay */}
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md px-4 py-2 text-xs text-white border border-white/30 transition-all shadow-lg"
          >
            Demo Alert Modal
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          alert('ยืนยันแล้ว!');
          setIsModalOpen(false);
        }}
        title="ยกเลิกการใช้งานบัญชี"
        description="คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการใช้งานบัญชีของคุณ? ข้อมูลทั้งหมดของคุณจะถูกลบออกอย่างถาวร การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmText="ยืนยันการยกเลิก"
        cancelText="ยกเลิก"
        type="danger"
      />

      <AlertModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        onConfirm={() => setIsErrorModalOpen(false)}
        title="เข้าสู่ระบบไม่สำเร็จ"
        description={error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'}
        confirmText="ตกลง"
        type="danger"
        showCancelButton={false}
      />
    </div>
  );
}
