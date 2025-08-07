'use client';


import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, FileDown, BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRange {
  from: Date;
  to: Date;
}

interface ReportsHeaderProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export default function ReportsHeader({ dateRange, onDateRangeChange }: ReportsHeaderProps) {
  const [stats, setStats] = useState({
    totalLeads: 0,
    conversionRate: 0,
    revenue: 0,
    targetAchievement: 0
  });

  useEffect(() => {
    fetchReportStats();
  }, [dateRange]);

  const fetchReportStats = async () => {
    try {
      const response = await fetch(`/api/reports?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalLeads: data.summary?.totalLeads || 0,
          conversionRate: parseFloat(data.summary?.conversionRate || '0'),
          revenue: data.summary?.totalRevenue || 0,
          targetAchievement: 72 // This would come from target calculation
        });
      }
    } catch (error) {
      console.error('Error fetching report stats:', error);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
      format: 'excel'
    });
    
    fetch(`/api/reports/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      }
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports-${dateRange.from.toISOString().split('T')[0]}-to-${dateRange.to.toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    })
    .catch(error => {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Analyze performance and track business metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-auto justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    onDateRangeChange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          
          <Button variant="outline" onClick={handleExportExcel}>
            <FileDown className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Leads</p>
              <p className="text-2xl font-bold">{stats.totalLeads}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Conversion Rate</p>
              <p className="text-2xl font-bold">{stats.conversionRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Revenue</p>
              <p className="text-2xl font-bold">${stats.revenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Target Achievement</p>
              <p className="text-2xl font-bold">{stats.targetAchievement}%</p>
            </div>
            <div className="h-8 w-8 bg-purple-400 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">{stats.targetAchievement}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}