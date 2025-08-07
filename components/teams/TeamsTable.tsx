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
import { Edit, Trash2, MoreHorizontal, Users, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EditTeamModal from './EditTeamModal';
import ManageTeamMembersModal from './ManageTeamMembersModal';

interface Team {
  _id: string;
  name: string;
  description?: string;
  manager: {
    _id: string;
    name: string;
    email: string;
  };
  members: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface TeamsTableProps {
  teams: Team[];
  isLoading: boolean;
  onTeamUpdate: () => void;
  currentUserRole: string;
}

export default function TeamsTable({ 
  teams, 
  isLoading, 
  onTeamUpdate, 
  currentUserRole 
}: TeamsTableProps) {
  const [sortField, setSortField] = useState<keyof Team>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [manageTeam, setManageTeam] = useState<Team | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant="secondary" className={isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const sortedTeams = [...teams].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (aVal === bVal) return 0;
    
    const comparison = aVal > bVal ? 1 : -1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: keyof Team) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (team: Team) => {
    setEditTeam(team);
    setIsEditModalOpen(true);
  };

  const handleManageMembers = (team: Team) => {
    setManageTeam(team);
    setIsManageModalOpen(true);
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (response.ok) {
        onTeamUpdate();
      } else {
        alert('Failed to delete team');
      }
    } catch (error) {
      alert('Error deleting team');
    }
  };

  const handleEditSuccess = () => {
    onTeamUpdate();
    setIsEditModalOpen(false);
    setEditTeam(null);
  };

  const handleManageSuccess = () => {
    onTeamUpdate();
    setIsManageModalOpen(false);
    setManageTeam(null);
  };

  const canEditTeam = (team: Team) => {
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'manager') {
      return team.manager._id === localStorage.getItem('user-id');
    }
    return false;
  };

  const canDeleteTeam = (team: Team) => {
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'manager') {
      return team.manager._id === localStorage.getItem('user-id');
    }
    return false;
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

  if (sortedTeams.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Users className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
            <p className="text-gray-500">Get started by creating your first team</p>
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
                    onClick={() => handleSort('name')}
                  >
                    Team Name
                    {sortField === 'name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
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
                {sortedTeams.map((team) => (
                  <TableRow key={team._id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.description || '-'}</TableCell>
                    <TableCell>{team.manager.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        {team.members.length}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(team.isActive)}</TableCell>
                    <TableCell>{team.createdBy.name}</TableCell>
                    <TableCell>{new Date(team.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditTeam(team) && (
                            <DropdownMenuItem onClick={() => handleEdit(team)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canEditTeam(team) && (
                            <DropdownMenuItem onClick={() => handleManageMembers(team)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Manage Members
                            </DropdownMenuItem>
                          )}
                          {canDeleteTeam(team) && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(team._id)}
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

      <EditTeamModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditTeam(null);
        }}
        onSuccess={handleEditSuccess}
        team={editTeam}
      />

      <ManageTeamMembersModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setManageTeam(null);
        }}
        onSuccess={handleManageSuccess}
        team={manageTeam}
      />
    </>
  );
}