'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserPlus, UserMinus } from 'lucide-react';

interface Team {
  _id: string;
  name: string;
  members: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

interface ManageTeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  team: Team | null;
}

export default function ManageTeamMembersModal({ isOpen, onClose, onSuccess, team }: ManageTeamMembersModalProps) {
  const [availableUsers, setAvailableUsers] = useState<Array<{ _id: string; name: string; email: string; role: string }>>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && team) {
      fetchAvailableUsers();
    }
  }, [isOpen, team]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter to show only agents not already in the team
        const currentMemberIds = team?.members.map(member => member._id) || [];
        const availableAgents = data.filter((user: { _id: string; name: string; email: string; role: string }) => 
          user.role === 'agent' && !currentMemberIds.includes(user._id)
        );
        setAvailableUsers(availableAgents);
      }
    } catch (error:any) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser || !team) return;
    
    setIsLoading(true);

    try {
      const updatedMembers = [...team.members.map(m => m._id), selectedUser];
      
      const response = await fetch(`/api/teams/${team._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          name: team.name,
          members: updatedMembers
        }),
      });

      if (response.ok) {
        toast.success('Member added successfully');
        onSuccess();
        setSelectedUser('');
        fetchAvailableUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to add member');
      }
    } catch (error:any) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!team) return;
    
    setIsLoading(true);

    try {
      const updatedMembers = team.members.filter(m => m._id !== memberId).map(m => m._id);
      
      const response = await fetch(`/api/teams/${team._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          name: team.name,
          members: updatedMembers
        }),
      });

      if (response.ok) {
        toast.success('Member removed successfully');
        onSuccess();
        fetchAvailableUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to remove member');
      }
    } catch (error:any) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Team Members</DialogTitle>
          <DialogDescription>
            Add or remove members from {team?.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Members */}
          <div className="space-y-3">
            <Label>Current Members ({team?.members.length || 0})</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {team?.members.map((member) => (
                <div key={member._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {member.role}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member._id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!team?.members || team.members.length === 0) && (
                <p className="text-gray-500 text-center py-4">No members assigned yet</p>
              )}
            </div>
          </div>

          {/* Add New Member */}
          <div className="space-y-3">
            <Label>Add New Member</Label>
            <div className="flex items-center space-x-2">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select user to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddMember}
                disabled={!selectedUser || isLoading}
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {availableUsers.length === 0 && (
              <p className="text-gray-500 text-sm">No available agents to add</p>
            )}
          </div>

        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}