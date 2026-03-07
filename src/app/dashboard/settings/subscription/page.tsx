'use client';

import React from 'react';
import { CreditCard, Package, CheckCircle2 } from 'lucide-react';

export default function SubscriptionPage() {
  const plans = [
    {
      name: 'Free',
      price: '฿0',
      features: ['1 Branch', 'Basic Reports', 'Community Support'],
      current: true,
    },
    {
      name: 'Pro',
      price: '฿990/month',
      features: ['Unlimited Branches', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
      current: false,
    },
    {
      name: 'Enterprise',
      price: 'Contact Us',
      features: ['Custom Solutions', 'Dedicated Manager', 'SLA', 'API Access'],
      current: false,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">ต่ออายุการใช้งาน & เลือกแผนของคุณ</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">เลือกแผนที่เหมาะกับธุรกิจของคุณเพื่อสิทธิประโยชน์ที่มากกว่า</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border bg-white dark:bg-gray-800 p-8 shadow-sm flex flex-col ${
              plan.current ? 'border-brand ring-1 ring-brand' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {plan.current && (
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand text-white px-3 py-1 rounded-full text-sm font-medium">
                แผนปัจจุบัน
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">{plan.price}</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-3 px-4 rounded-xl font-bold transition-all ${
                plan.current
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/20'
              }`}
            >
              {plan.current ? 'ใช้งานอยู๋' : 'เลือกแผนนี้'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-brand/5 rounded-3xl p-8 border border-brand/10 flex flex-col md:flex-row items-center gap-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm">
          <CreditCard className="h-10 w-10 text-brand" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">มีคำถามเกี่ยวกับการชำระเงิน?</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">ทีมงานของเราพร้อมช่วยเหลือคุณตลอด 24 ชั่วโมง</p>
        </div>
        <button className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all">
          ติดต่อเจ้าหน้าที่
        </button>
      </div>
    </div>
  );
}
