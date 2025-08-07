'use client';
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Target, TrendingUp } from 'lucide-react';

interface TargetsHeaderProps {
  onAddTarget: () => void;
}

export default function TargetsHeader({ onAddTarget }: TargetsHeaderProps) {
  const [stats, setStats] = useState({
    totalTargets: 0,
    achieved: 0,
    progress: 0
  });

  useEffect(() => {
    fetchTargetStats();
  }, []);

  const fetchTargetStats = async () => {
    try {
      const response = await fetch('/api/targets/main', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalTargets: data.total || 0,
          achieved: data.achieved || 0,
          progress: data.percentage || 0
        });
      }
    } catch (error:any) {
      console.error('Error fetching target stats:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Targets</h1>
          <p className="text-gray-600 mt-1">Manage daily sales targets and track progress</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={onAddTarget} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Target
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Targets</p>
              <p className="text-2xl font-bold">${stats.totalTargets.toLocaleString()}</p>
            </div>
            <Target className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Achieved</p>
              <p className="text-2xl font-bold">${stats.achieved.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Progress</p>
              <p className="text-2xl font-bold">{stats.progress}%</p>
            </div>
            <div className="h-8 w-8 bg-purple-400 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">{stats.progress}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}