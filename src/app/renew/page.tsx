'use client';

import React from 'react';
import { CreditCard, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function PublicRenewPage() {
  const plans = [
    {
      name: 'Free',
      price: '฿0',
      features: ['1 Branch', 'Basic Reports', 'Community Support'],
    },
    {
      name: 'Pro',
      price: '฿990/month',
      features: ['Unlimited Branches', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Contact Us',
      features: ['Custom Solutions', 'Dedicated Manager', 'SLA', 'API Access'],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/login" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium text-sm">กลับไปหน้าเข้าสู่ระบบ</span>
          </Link>
          <div className="relative h-10 w-32">
            <Image
              src="/img/image__1_-removebg-preview.png"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </nav>

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">ต่ออายุการใช้งานบัญชีของคุณ</h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">เลือกแผนที่ต้องการเพื่อเปิดใช้งานบัญชีอีกครั้งและใช้งานระบบต่อไปอย่างไม่มีสะดุด</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl border bg-white p-8 shadow-sm flex flex-col transition-transform hover:scale-[1.02] duration-300 ${
                  plan.popular ? 'border-brand ring-2 ring-brand ring-opacity-20' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    ยอดนิยม
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-brand">{plan.price}</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm text-gray-600">
                      <CheckCircle2 className="h-5 w-5 text-brand mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-4 px-6 rounded-2xl font-bold transition-all ${
                    plan.popular
                      ? 'bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/30'
                      : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  เลือก {plan.name}
                </button>
              </div>
            ))}
          </div>

          {/* Footer Card */}
          <div className="mt-20 bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl flex flex-col md:flex-row items-center gap-10">
            <div className="bg-brand/5 p-6 rounded-3xl">
              <CreditCard className="h-12 w-12 text-brand" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">ต้องการความช่วยเหลือ?</h2>
              <p className="text-gray-600 mt-2 text-lg">หากคุณมีปัญหาในการชำระเงิน หรือต้องการใบเสนอราคาสำหรับธุรกิจขนาดใหญ่</p>
            </div>
            <button className="bg-brand text-white px-10 py-4 rounded-2xl font-bold hover:bg-brand-hover transition-all w-full md:w-auto shadow-lg shadow-brand/20">
              ติดต่อแอดมิน (Line)
            </button>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center text-gray-500 text-sm">
        &copy; 2026 ARTZI PROJECT. All rights reserved.
      </footer>
    </div>
  );
}
