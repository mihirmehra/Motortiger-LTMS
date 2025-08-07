'use client';

import { useState } from 'react';
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
import { Edit, Trash2, MoreHorizontal, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EditTargetModal from './EditTargetModal';

interface Target {
  _id: string;
  date: string;
  amount: number;
  achieved: number;
  description?: string;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface TargetsTableProps {
  targets: Target[];
  isLoading: boolean;
  onTargetUpdate: () => void;
}

export default function TargetsTable({ targets, isLoading, onTargetUpdate }: TargetsTableProps) {
  const [sortField, setSortField] = useState<keyof Target>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editTarget, setEditTarget] = useState<Target | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const getProgressBadge = (achieved: number, amount: number) => {
    const percentage = amount > 0 ? (achieved / amount) * 100 : 0;
    
    if (percentage >= 100) {
      return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
    } else if (percentage >= 75) {
      return <Badge className="bg-blue-100 text-blue-700">On Track</Badge>;
    } else if (percentage >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-700">Behind</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-700">Critical</Badge>;
    }
  };

  const sortedTargets = [...targets].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal === bVal) return 0;

    if (aVal === undefined) return sortDirection === 'asc' ? -1 : 1;
    if (bVal === undefined) return sortDirection === 'asc' ? 1 : -1;

    const comparison = aVal > bVal ? 1 : -1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: keyof Target) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (target: Target) => {
    setEditTarget(target);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (targetId: string) => {
    if (!confirm('Are you sure you want to delete this target?')) return;

    try {
      const response = await fetch(`/api/targets/${targetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (response.ok) {
        onTargetUpdate();
      } else {
        alert('Failed to delete target');
      }
    } catch (error:any) {
      alert('Error deleting target');
    }
  };

  const handleEditSuccess = () => {
    onTargetUpdate();
    setIsEditModalOpen(false);
    setEditTarget(null);
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

  if (sortedTargets.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Calendar className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No targets found</h3>
            <p className="text-gray-500">Get started by adding your first target</p>
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
                    onClick={() => handleSort('date')}
                  >
                    Date
                    {sortField === 'date' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('amount')}
                  >
                    Target Amount
                    {sortField === 'amount' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead>Achieved</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTargets.map((target) => {
                  const percentage = target.amount > 0 ? (target.achieved / target.amount) * 100 : 0;
                  return (
                    <TableRow key={target._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {new Date(target.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>${target.amount.toLocaleString()}</TableCell>
                      <TableCell>${target.achieved.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getProgressBadge(target.achieved, target.amount)}</TableCell>
                      <TableCell>{target.description || '-'}</TableCell>
                      <TableCell>{target.createdBy.name}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(target)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(target._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <EditTargetModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditTarget(null);
        }}
        onSuccess={handleEditSuccess}
        target={editTarget}
      />
    </>
  );
}