'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, FileDown, FileUp } from 'lucide-react';
import ImportLeadsModal from './ImportLeadsModal';

interface LeadsHeaderProps {
  onAddLead: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export default function LeadsHeader({ 
  onAddLead, 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange 
}: LeadsHeaderProps) {
  const [userRole, setUserRole] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('user-role');
    setUserRole(role || '');
  }, []);

  const canManageLeads = ['admin', 'manager'].includes(userRole);

  const handleImport = () => {
    setIsImportModalOpen(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/leads/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Export failed');
      }
    } catch (error:any) {
      alert('Export error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSuccess = () => {
    setIsImportModalOpen(false);
    // Refresh leads data - this would be passed from parent component
    window.location.reload();
  };
  return (
    <>
      <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Manage your sales leads and track progress</p>
        </div>
        
        <div className="flex items-center gap-2">
          {canManageLeads && (
            <>
                <Button variant="outline" size="sm" onClick={handleImport}>
                <FileUp className="mr-2 h-4 w-4" />
                  Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                <FileDown className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </>
          )}
          <Button onClick={onAddLead} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search leads by name, phone, or product..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      </div>

      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </>
  );
}