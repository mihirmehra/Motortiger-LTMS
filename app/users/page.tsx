'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import UsersHeader from '@/components/users/UsersHeader';
import UsersTable from '@/components/users/UsersTable';
import AddUserModal from '@/components/users/AddUserModal';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('user-role');
    setUserRole(role || '');
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  const handleUserAdded = () => {
    fetchUsers();
    setIsAddModalOpen(false);
  };

  // Check if user can manage users
  const canManageUsers = ['admin', 'manager'].includes(userRole);

  if (!canManageUsers) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view users.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <UsersHeader onAddUser={handleAddUser} />
        
        <UsersTable 
          users={users}
          isLoading={isLoading}
          onUserUpdate={fetchUsers}
          currentUserRole={userRole}
        />

        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleUserAdded}
        />
      </div>
    </DashboardLayout>
  );
}