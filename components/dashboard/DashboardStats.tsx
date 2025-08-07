'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, TrendingUp, DollarSign } from 'lucide-react';

interface DashboardStatsProps {
  userRole: string;
}

interface Stats {
  totalLeads: number;
  newLeads: number;
  soldLeads: number;
  targetProgress: number;
}

export default function DashboardStats({ userRole }: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    newLeads: 0,
    soldLeads: 0,
    targetProgress: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch stats:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
      changeColor: 'text-green-600'
    },
    {
      title: 'New Leads',
      value: stats.newLeads,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+5%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Sold This Month',
      value: stats.soldLeads,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: '+8%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Target Progress',
      value: `${stats.targetProgress}%`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+3%',
      changeColor: 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={stat.title} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`h-8 w-8 ${stat.bgColor} rounded-full flex items-center justify-center`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className={stat.changeColor}>{stat.change}</span> from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}