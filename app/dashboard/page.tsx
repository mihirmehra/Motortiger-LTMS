'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RecentActivities from '@/components/dashboard/RecentActivities';
import QuickActions from '@/components/dashboard/QuickActions';

export default function Dashboard() {
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('user-role');
    setUserRole(role || '');
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
        </div>

        <DashboardStats userRole={userRole} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivities />
          </div>
          <div>
            <QuickActions userRole={userRole} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}