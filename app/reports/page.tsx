'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ReportsHeader from '@/components/reports/ReportsHeader';
import ReportsCharts from '@/components/reports/ReportsCharts';
import ReportsTable from '@/components/reports/ReportsTable';

export default function ReportsPage() {
  const [reportData, setReportData] = useState({
    leads: [],
    targets: [],
    sales: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('user-role');
    setUserRole(role || '');
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reports?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error:any) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user can view reports
  const canViewReports = ['admin', 'manager'].includes(userRole);

  if (!canViewReports) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view reports.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ReportsHeader 
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        
        <ReportsCharts 
          data={reportData}
          isLoading={isLoading}
        />
        
        <ReportsTable 
          data={reportData}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}