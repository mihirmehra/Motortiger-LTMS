'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import TeamsHeader from '@/components/teams/TeamsHeader';
import TeamsTable from '@/components/teams/TeamsTable';
import AddTeamModal from '@/components/teams/AddTeamModal';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('user-role');
    setUserRole(role || '');
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error:any) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeam = () => {
    setIsAddModalOpen(true);
  };

  const handleTeamAdded = () => {
    fetchTeams();
    setIsAddModalOpen(false);
  };

  // Check if user can manage teams
  const canManageTeams = ['admin', 'manager'].includes(userRole);

  if (!canManageTeams) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view teams.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <TeamsHeader onAddTeam={handleAddTeam} />
        
        <TeamsTable 
          teams={teams}
          isLoading={isLoading}
          onTeamUpdate={fetchTeams}
          currentUserRole={userRole}
        />

        <AddTeamModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleTeamAdded}
        />
      </div>
    </DashboardLayout>
  );
}