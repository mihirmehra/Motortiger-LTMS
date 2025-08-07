'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Target {
  _id: string;
  date: string;
  amount: number;
  achieved: number;
  description?: string;
}

interface EditTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  target: Target | null;
}

export default function EditTargetModal({ isOpen, onClose, onSuccess, target }: EditTargetModalProps) {
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    achieved: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (target) {
      setFormData({
        date: new Date(target.date).toISOString().split('T')[0],
        amount: target.amount.toString(),
        achieved: target.achieved.toString(),
        description: target.description || ''
      });
    }
  }, [target]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/targets/${target._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          date: formData.date,
          amount: parseFloat(formData.amount),
          achieved: parseFloat(formData.achieved),
          description: formData.description
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update target');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Target</DialogTitle>
          <DialogDescription>
            Update the target information and progress.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Target Amount *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter target amount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="achieved">Achieved Amount *</Label>
            <Input
              id="achieved"
              type="number"
              min="0"
              step="0.01"
              value={formData.achieved}
              onChange={(e) => handleInputChange('achieved', e.target.value)}
              placeholder="Enter achieved amount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description for this target"
              rows={3}
            />
          </div>

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
                'Update Target'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}