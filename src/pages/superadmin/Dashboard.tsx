import React from 'react';
import { Store, Users, CreditCard, Activity } from 'lucide-react';

export function SuperAdminDashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-500">Monitor your SaaS platform's performance and growth.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Stores" value="124" change="+12 this week" icon={<Store className="text-blue-600" />} />
        <StatCard title="Active Trials" value="45" change="8 converting soon" icon={<Activity className="text-emerald-600" />} />
        <StatCard title="Monthly Recurring Revenue" value="$4,250" change="+15% vs last month" icon={<CreditCard className="text-violet-600" />} />
        <StatCard title="Total Users" value="892" change="+34 this week" icon={<Users className="text-amber-600" />} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Store size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New store signed up: Fashion Hub</p>
                  <p className="text-xs text-gray-500">Started 14-day Pro trial</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-xs font-medium text-emerald-600">{change}</p>
    </div>
  );
}
