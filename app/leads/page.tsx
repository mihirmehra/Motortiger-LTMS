'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import LeadsTable from '@/components/leads/LeadsTable';
import LeadsHeader from '@/components/leads/LeadsHeader';
import AddLeadModal from '@/components/leads/AddLeadModal';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/leads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      } else {
        console.error('Failed to fetch leads:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLead = () => {
    setIsAddModalOpen(true);
  };

  const handleLeadAdded = () => {
    fetchLeads();
    setIsAddModalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <LeadsHeader 
          onAddLead={handleAddLead}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
        
        <LeadsTable 
          leads={leads}
          isLoading={isLoading}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onLeadUpdate={fetchLeads}
        />

        <AddLeadModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleLeadAdded}
        />
      </div>
    </DashboardLayout>
  );
}