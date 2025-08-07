'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import TargetsHeader from '@/components/targets/TargetsHeader';
import TargetsTable from '@/components/targets/TargetsTable';
import AddTargetModal from '@/components/targets/AddTargetModal';

export default function TargetsPage() {
  const [targets, setTargets] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('user-role');
    setUserRole(role || '');
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/targets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTargets(data);
      }
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTarget = () => {
    setIsAddModalOpen(true);
  };

  const handleTargetAdded = () => {
    fetchTargets();
    setIsAddModalOpen(false);
  };

  // Check if user can manage targets
  const canManageTargets = ['admin', 'manager'].includes(userRole);

  if (!canManageTargets) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view targets.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <TargetsHeader onAddTarget={handleAddTarget} />
        
        <TargetsTable 
          targets={targets}
          isLoading={isLoading}
          onTargetUpdate={fetchTargets}
        />

        <AddTargetModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleTargetAdded}
        />
      </div>
    </DashboardLayout>
  );
}