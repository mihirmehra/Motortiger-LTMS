'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users, Shield, UserCheck } from 'lucide-react';

interface TeamsHeaderProps {
  onAddTeam: () => void;
}

export default function TeamsHeader({ onAddTeam }: TeamsHeaderProps) {
  const [stats, setStats] = useState({
    totalTeams: 0,
    activeTeams: 0,
    totalMembers: 0
  });

  useEffect(() => {
    fetchTeamStats();
  }, []);

  const fetchTeamStats = async () => {
    try {
      const response = await fetch('/api/teams/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching team stats:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600 mt-1">Manage teams and team members</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={onAddTeam} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Team
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Teams</p>
              <p className="text-2xl font-bold">{stats.totalTeams}</p>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Active Teams</p>
              <p className="text-2xl font-bold">{stats.activeTeams}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Members</p>
              <p className="text-2xl font-bold">{stats.totalMembers}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>
    </div>
  );
}