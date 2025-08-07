'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Phone, Mail, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EditLeadModal from './EditLeadModal';
import SendEmailModal from './SendEmailModal';

interface Lead {
  _id: string;
  customerName: string;
  mobileNumber: string;
  email?: string;
  productName?: string;
  productPrice?: number;
  salePrice?: number;
  profitMargin?: number;
  source?: string;
  status: 'new' | 'in-progress' | 'sold' | 'lost';
  assignedTo: string | { _id: string; name: string; email: string };
  createdBy: string | { _id: string; name: string; email: string };
  createdAt: string;
}

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  searchTerm: string;
  statusFilter: string;
  onLeadUpdate: () => void;
}

export default function LeadsTable({ 
  leads, 
  isLoading, 
  searchTerm, 
  statusFilter, 
  onLeadUpdate 
}: LeadsTableProps) {
  const [sortField, setSortField] = useState<keyof Lead>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [emailLead, setEmailLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('user-role');
    const id = localStorage.getItem('user-id');
    setUserRole(role || '');
    setUserId(id || '');
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'new': { label: 'New', className: 'bg-blue-100 text-blue-700' },
      'in-progress': { label: 'In Progress', className: 'bg-yellow-100 text-yellow-700' },
      'sold': { label: 'Sold', className: 'bg-green-100 text-green-700' },
      'lost': { label: 'Lost', className: 'bg-red-100 text-red-700' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.new;
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const filteredAndSortedLeads = leads
    .filter(lead => {
      const matchesSearch = searchTerm === '' || 
        lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.mobileNumber.includes(searchTerm) ||
        (lead.productName && lead.productName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === bVal) return 0;
      if (aVal === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (bVal === undefined) return sortDirection === 'asc' ? 1 : -1;

      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditLead(lead);
    setIsEditModalOpen(true);
  };

  const handleSendEmail = (lead: Lead) => {
    setEmailLead(lead);
    setIsEmailModalOpen(true);
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (response.ok) {
        onLeadUpdate();
      } else {
        alert('Failed to delete lead');
      }
    } catch (error) {
      alert('Error deleting lead');
    }
  };

  const canEditLead = (lead: Lead) => {
    if (userRole === 'admin') return true;
    if (userRole === 'manager') {
      // Manager can edit leads assigned to their team members or themselves
      return true; // This will be validated on the backend
    }
    if (userRole === 'agent') {
      // Agent can only edit their own leads
      const assignedToId = typeof lead.assignedTo === 'object' && lead.assignedTo ? lead.assignedTo._id : lead.assignedTo;
      return assignedToId === userId;
    }
    return false;
  };

  const canDeleteLead = (lead: Lead) => {
    if (userRole === 'admin') return true;
    if (userRole === 'manager') {
      // Manager can delete leads assigned to their team members or themselves
      return true; // This will be validated on the backend
    }
    if (userRole === 'agent') {
      // Agent can only delete their own leads
      const assignedToId = typeof lead.assignedTo === 'object' && lead.assignedTo ? lead.assignedTo._id : lead.assignedTo;
      return assignedToId === userId;
    }
    return false;
  };

  const handleEditSuccess = () => {
    onLeadUpdate();
    setIsEditModalOpen(false);
    setEditLead(null);
  };

  const handleEmailSuccess = () => {
    onLeadUpdate();
    setIsEmailModalOpen(false);
    setEmailLead(null);
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onLeadUpdate();
      } else {
        alert('Failed to update lead status');
      }
    } catch (error) {
      alert('Error updating lead status');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredAndSortedLeads.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Phone className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first lead'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('customerName')}
                  >
                    Customer Name
                    {sortField === 'customerName' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Product Price</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Profit Margin</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {sortField === 'status' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created
                    {sortField === 'createdAt' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedLeads.map((lead) => (
                  <TableRow key={lead._id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{lead.customerName}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-1" />
                        {lead.mobileNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.email ? (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-1" />
                          {lead.email}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{lead.productName || '-'}</TableCell>
                    <TableCell>
                      {lead.productPrice ? `$${lead.productPrice.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {lead.salePrice ? `$${lead.salePrice.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {lead.profitMargin ? (
                        <span className={lead.profitMargin > 0 ? 'text-green-600' : 'text-red-600'}>
                          ${lead.profitMargin.toLocaleString()}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{lead.source || '-'}</TableCell>
                    <TableCell>
                      {canEditLead(lead) ? (
                        <Select 
                          value={lead.status} 
                          onValueChange={(value) => handleStatusChange(lead._id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">🆕 New</SelectItem>
                            <SelectItem value="in-progress">⏳ In Progress</SelectItem>
                            <SelectItem value="sold">✅ Sold</SelectItem>
                            <SelectItem value="lost">❌ Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getStatusBadge(lead.status)
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.assignedTo && typeof lead.assignedTo === 'object' && lead.assignedTo.name 
                        ? lead.assignedTo.name 
                        : (lead.assignedTo && typeof lead.assignedTo === 'string' ? lead.assignedTo : 'Unassigned')
                      }
                    </TableCell>
                    <TableCell>
                      {typeof lead.createdBy === 'object'
                        ? lead.createdBy?.name || '-'
                        : lead.createdBy || '-'
                      }
                    </TableCell>
                    <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditLead(lead) && (
                            <DropdownMenuItem onClick={() => handleEdit(lead)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleSendEmail(lead)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          {canDeleteLead(lead) && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(lead._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditLead(null);
        }}
        onSuccess={handleEditSuccess}
        lead={editLead}
      />

      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setEmailLead(null);
        }}
        onSuccess={handleEmailSuccess}
        lead={emailLead}
      />
    </>
  );
}