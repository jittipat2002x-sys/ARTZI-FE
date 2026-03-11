'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShieldCheck, 
  ArrowRight, 
  Package, 
  PieChart, 
  Calendar, 
  Users, 
  Stethoscope,
  ChevronRight,
  CheckCircle2,
  Lock,
  Zap,
  Star,
  LucideProps,
  Hotel,
  Bed,
  ClipboardList,
  TestTube2,
  UploadCloud
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-x-hidden selection:bg-brand/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-brand">
            <Image 
              src="/img/image__1_-removebg-preview.png" 
              alt="PetHeart Logo" 
              width={32} 
              height={32}
              className="object-contain"
            />
            <span className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">Pet<span className="text-brand">Heart</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-brand transition-colors">คุณสมบัติ</a>
            <a href="#pricing" className="text-sm font-medium hover:text-brand transition-colors">ราคา</a>
            <Link href="/login" className="text-sm font-medium hover:text-brand transition-colors">เข้าสู่ระบบ</Link>
            <Link href="/register" className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-sm font-bold hover:scale-105 transition-all">
              เริ่มใช้งานฟรี
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 border-b border-zinc-100 dark:border-zinc-900 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand/5 blur-[120px] -z-10 rounded-full"></div>
        
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand text-white text-xs font-black shadow-lg shadow-brand/20 animate-bounce">
            <Star size={14} className="fill-white" /> ระบบบริหารจัดการคลินิกสัตว์ยุคใหม่
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
            ยกระดับคลินิกของคุณ <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand to-teal-500 underline decoration-brand/30">ให้เหนือชั้นกว่าที่เคย</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-zinc-500 dark:text-zinc-400 font-medium">
            จัดการสต็อกสินค้า นัดหมาย รายงานการเงิน และประวัติการรักษา <br className="hidden md:block" />
            ครบจบในที่เดียว ด้วยระบบที่ออกแบบมาเพื่อความพรีเมียมและใช้งานง่าย
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-brand text-white rounded-2xl font-black text-lg hover:scale-105 hover:bg-brand/90 transition-all flex items-center justify-center gap-2">
              สมัครใช้งานตอนนี้ <ArrowRight size={20} />
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl font-bold text-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
              เข้าสู่ระบบ
            </Link>
          </div>

          {/* Dashboard Mockup */}
          <div className="mt-20 relative group">
            <div className="absolute inset-0 bg-brand/20 blur-[100px] opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            <div className="relative rounded-[2rem] border-[12px] border-zinc-900/5 dark:border-zinc-100/5 bg-zinc-200 dark:bg-zinc-800 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
               <Image 
                src="/img/landing-mockup.png" 
                alt="PetHeart Dashboard Preview" 
                width={1200} 
                height={800}
                className="w-full h-auto object-cover"
                priority
               />
            </div>
            {/* Floating Elements */}
            <div className="absolute -bottom-10 -right-10 hidden lg:block animate-float animation-delay-500">
               <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <Zap size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-black text-zinc-400">Inventory Status</p>
                    <p className="text-sm font-bold">คลังสินค้าอัปเดตแบบเรียลไทม์</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-zinc-50 dark:bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">ฟีเจอร์ที่ช่วยให้งานของคุณง่ายขึ้น</h2>
            <p className="text-zinc-500 font-medium">ทุกเครื่องมือที่คุณต้องการสำหรับการบริหารจัดการความสำเร็จ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Stethoscope className="text-brand" />}
              title="ระบบตรวจรักษาครบวงจร"
              desc="บันทึกประวัติ OPD (SOAP), การแอดมิท (IPD) และผล Lab พร้อมอัปโหลดไฟล์ ครบจบในที่เดียวเพื่อสัตวแพทย์"
            />
            <FeatureCard 
              icon={<Calendar className="text-brand" />}
              title="นัดหมายและรับฝากเลี้ยง"
              desc="จัดการตารางนัดหมายล่วงหน้าและระบบรับฝากเลี้ยง (Hotel) พร้อมผังห้องพักแบบเรียลไทม์ที่ตรวจสอบง่าย"
            />
            <FeatureCard 
              icon={<Package className="text-brand" />}
              title="คุมสต็อกสินค้าและยา"
              desc="ระบบคลังสินค้าอัจฉริยะ แจ้งเตือนสินค้าใกล้หมด ติดตามวันหมดอายุ และคุมล็อตสินค้าได้แบบอัตโนมัติ"
            />
            <FeatureCard 
              icon={<PieChart className="text-brand" />}
              title="สรุปรายได้และบัญชี"
              desc="วิเคราะห์รายได้-รายจ่ายแบบวันต่อวัน พร้อมรายงานสถิติยอดการผลิตและกำไรที่แม่นยำเพื่อเจ้าของคลินิก"
            />
            <FeatureCard 
              icon={<Lock className="text-brand" />}
              title="ความปลอดภัยสูงสุด"
              desc="ข้อมูลส่วนบุคคลและประวัติการรักษาปลอดภัยด้วยมาตรฐานสากล พร้อมระบบแยกสิทธิ์ตามตำแหน่งงาน"
            />
            <FeatureCard 
              icon={<Zap className="text-brand" />}
              title="ระบบคลาวด์ 24 ชม."
              desc="เข้าถึงได้ทุกที่จากทุกอุปกรณ์ ไม่ต้องลงโปรแกรมเพิ่ม พร้อมระบบสำรองข้อมูลอัตโนมัติทุกวัน"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 border-t border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto">
           <div className="bg-zinc-900 dark:bg-white rounded-[3rem] p-12 md:p-20 text-white dark:text-zinc-900 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute right-0 top-0 w-64 h-64 bg-brand/20 blur-[80px] rounded-full translate-x-32 -translate-y-32"></div>
             
             <div className="space-y-6 max-w-lg z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand text-white text-xs font-black shadow-lg shadow-brand/20">
                  <Zap size={14} className="fill-white" /> PRICING PLAN
                </div>
                <h2 className="text-4xl md:text-5xl font-black leading-tight">เริ่มต้นจัดการ <br /> คลินิกในราคาเดียว</h2>
                <ul className="space-y-4">
                  <PriceItem text="ใช้งานได้ทุกฟีเจอร์ (No Hidden Costs)" />
                  <PriceItem text="ไม่จำกัดพนักงานและสัตวแพทย์" />
                  <PriceItem text="ไม่จำกัดจำนวนข้อมูลลูกค้า" />
                  <PriceItem text="Backup ข้อมูลอัตโนมัติทุกวัน" />
                </ul>
             </div>

             <div className="bg-white dark:bg-zinc-900 p-10 rounded-[2.5rem] shadow-2xl text-center w-full md:w-[400px] border border-zinc-200 dark:border-zinc-800 z-10">
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-2">เหมาจ่ายรายเดือน</p>
                <div className="flex items-center justify-center gap-1 mb-8">
                  <span className="text-5xl md:text-6xl font-black text-brand brightness-125 dark:brightness-150">990</span>
                  <div className="text-left">
                    <p className="font-bold text-zinc-900 dark:text-white">บาท</p>
                    <p className="text-xs text-zinc-400">/ เดือน</p>
                  </div>
                </div>
                <Link href="/register" className="block w-full py-4 bg-brand text-white rounded-2xl font-black text-center hover:scale-[1.02] transition-all">
                  เริ่มทดลองใช้งานฟรี
                </Link>
                <p className="mt-4 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">คุ้มค่าที่สุดสำหรับคลินิกทุกสเกล</p>
             </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-100 dark:border-zinc-900 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Image 
              src="/img/image__1_-removebg-preview.png" 
              alt="PetHeart Logo" 
              width={24} 
              height={24}
              className="object-contain"
            />
            <span className="text-lg font-black tracking-tighter text-zinc-900 dark:text-white">Pet<span className="text-brand">Heart</span></span>
          </div>
          <p className="text-sm text-zinc-400 font-medium">© 2026 PetHeart Clinic Management System. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-zinc-400 hover:text-brand transition-colors">นโยบายความเป็นส่วนตัว</a>
            <a href="#" className="text-sm text-zinc-400 hover:text-brand transition-colors">เงื่อนไขการใช้งาน</a>
          </div>
        </div>
      </footer>

      {/* Styles for Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group">
      <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-100 dark:border-zinc-700 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon as React.ReactElement<LucideProps>, { size: 28, className: (icon as React.ReactElement<LucideProps>).props.className + " brightness-125" })}
      </div>
      <h3 className="text-xl font-black mb-3 text-zinc-900 dark:text-white tracking-tight">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function PriceItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-brand/20 dark:bg-brand/10 flex items-center justify-center">
        <CheckCircle2 size={12} className="text-brand" />
      </div>
      <span className="text-sm font-bold opacity-80">{text}</span>
    </li>
  );
}
