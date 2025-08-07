'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// --- Types ---
interface Lead {
  createdAt: string;
  status: 'new' | 'in-progress' | 'sold' | 'lost' | string;
  // Add other fields as needed
}

interface Target {
  date: string;
  amount: number;
  achieved: number;
}

interface ReportsChartsData {
  leads: Lead[];
  targets: Target[];
}

interface ReportsChartsProps {
  data: ReportsChartsData;
  isLoading: boolean;
}

interface LeadsDataItem {
  month: string;
  leads: number;
  sales: number;
}

interface StatusDataItem {
  name: string;
  value: number;
  color: string;
}

interface TargetDataItem {
  date: string;
  target: number;
  achieved: number;
}

interface ChartData {
  leadsData: LeadsDataItem[];
  statusData: StatusDataItem[];
  targetData: TargetDataItem[];
}

// --- Component ---
export default function ReportsCharts({ data, isLoading }: ReportsChartsProps) {
  const [chartData, setChartData] = useState<ChartData>({
    leadsData: [],
    statusData: [],
    targetData: [],
  });

  useEffect(() => {
    if (data && data.leads) {
      processChartData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const processChartData = () => {
    // Process leads by month
    const monthlyData: Record<string, LeadsDataItem> = {};
    data.leads.forEach((lead) => {
      const month = new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, leads: 0, sales: 0 };
      }
      monthlyData[month].leads++;
      if (lead.status === 'sold') {
        monthlyData[month].sales++;
      }
    });

    // Process status distribution
    const statusCounts: Record<string, number> = {};
    data.leads.forEach((lead) => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });

    const statusData: StatusDataItem[] = [
      { name: 'New', value: statusCounts['new'] || 0, color: '#3B82F6' },
      { name: 'In Progress', value: statusCounts['in-progress'] || 0, color: '#F59E0B' },
      { name: 'Sold', value: statusCounts['sold'] || 0, color: '#10B981' },
      { name: 'Lost', value: statusCounts['lost'] || 0, color: '#EF4444' },
    ];

    // Process target data
    const targetData: TargetDataItem[] = (data.targets || []).map((target) => ({
      date: target.date,
      target: target.amount,
      achieved: target.achieved,
    }));

    setChartData({
      leadsData: Object.values(monthlyData),
      statusData,
      targetData,
    });
  };

  const leadsData = chartData.leadsData;
  const statusData = chartData.statusData;
  const targetData = chartData.targetData;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Leads vs Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="leads" fill="#3B82F6" name="Leads" />
              <Bar dataKey="sales" fill="#10B981" name="Sales" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target vs Achievement</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={targetData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value: string) => new Date(value).toLocaleDateString()} />
              <YAxis />
              <Tooltip labelFormatter={(value: string) => new Date(value).toLocaleDateString()} />
              <Line type="monotone" dataKey="target" stroke="#EF4444" name="Target" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="achieved" stroke="#10B981" name="Achieved" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`$${value * 1000}`, 'Revenue']} />
              <Bar dataKey="sales" fill="#F59E0B" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
