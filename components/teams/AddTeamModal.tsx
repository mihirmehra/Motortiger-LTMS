'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AddTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTeamModal({ isOpen, onClose, onSuccess }: AddTeamModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    manager: string;
    members: string[];
  }>({
    name: '',
    description: '',
    manager: '',
    members: []
  });
  const [managers, setManagers] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [availableAgents, setAvailableAgents] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    if (isOpen) {
      const role = localStorage.getItem('user-role');
      const id = localStorage.getItem('user-id');
      setUserRole(role || '');
      setUserId(id || '');
      fetchManagers();
      fetchAvailableAgents();
    }
  }, [isOpen]);

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter to show only managers and admins
        const managerUsers = data.filter((user:any) => ['admin', 'manager'].includes(user.role));
        setManagers(managerUsers);
      }
    } catch (error:any) {
      console.error('Error fetching managers:', error);
    }
  };

  const fetchAvailableAgents = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter to show only agents without a team
        const agentsWithoutTeam = data.filter((user:any) => user.role === 'agent' && !user.team);
        setAvailableAgents(agentsWithoutTeam);
      }
    } catch (error:any) {
      console.error('Error fetching available agents:', error);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          ...formData,
          manager: formData.manager || (userRole === 'manager' ? userId : undefined)
        }),
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          name: '',
          description: '',
          manager: '',
          members: []
        });
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create team');
      }
    } catch (error:any) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMemberToggle = (agentId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      members: checked 
        ? [...prev.members, agentId]
        : prev.members.filter(id => id !== agentId)
    }));
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Team</DialogTitle>
          <DialogDescription>
            Create a new team and assign a manager to it.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter team description (optional)"
              rows={3}
            />
          </div>

          {userRole === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="manager">Team Manager *</Label>
              <Select value={formData.manager} onValueChange={(value) => handleInputChange('manager', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager._id} value={manager._id}>
                      {manager.name} ({manager.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {availableAgents.length > 0 && (
            <div className="space-y-3">
              <Label>Initial Team Members (Optional)</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-3">
                {availableAgents.map((agent) => (
                  <div key={agent._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`agent-${agent._id}`}
                      checked={formData.members.includes(agent._id)}
                      onCheckedChange={(checked) => handleMemberToggle(agent._id, Boolean(checked))}
                    />
                    <Label htmlFor={`agent-${agent._id}`} className="text-sm font-normal">
                      {agent.name} ({agent.email})
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Selected {formData.members.length} of {availableAgents.length} available agents
              </p>
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Create Team'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}