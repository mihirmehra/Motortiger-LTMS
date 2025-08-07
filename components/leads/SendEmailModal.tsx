'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Lead {
  _id: string;
  customerName: string;
  mobileNumber: string;
  email?: string;
  productName?: string;
}

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lead: Lead | null;
}

export default function SendEmailModal({ isOpen, onClose, onSuccess, lead }: SendEmailModalProps) {
  const [formData, setFormData] = useState({
    templateType: '',
    customSubject: '',
    customContent: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/leads/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          leadId: lead._id,
          templateType: formData.templateType === 'custom' ? null : formData.templateType,
          customSubject: formData.customSubject,
          customContent: formData.customContent
        }),
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          templateType: '',
          customSubject: '',
          customContent: ''
        });
        alert('Email sent successfully!');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to send email');
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Send an email to {lead?.customerName} 
            {lead?.email ? ` (${lead.email})` : ''} regarding {lead?.productName || 'their inquiry'}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="templateType">Email Template</Label>
            <Select value={formData.templateType} onValueChange={(value) => handleInputChange('templateType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template or create custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Email</SelectItem>
                <SelectItem value="leadFollowUp">Follow-up Email</SelectItem>
                <SelectItem value="leadWelcome">Welcome Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(!formData.templateType || formData.templateType === 'custom') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="customSubject">Subject *</Label>
                <Input
                  id="customSubject"
                  value={formData.customSubject}
                  onChange={(e) => handleInputChange('customSubject', e.target.value)}
                  placeholder="Enter email subject"
                  required={!formData.templateType || formData.templateType === 'custom'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customContent">Message *</Label>
                <Textarea
                  id="customContent"
                  value={formData.customContent}
                  onChange={(e) => handleInputChange('customContent', e.target.value)}
                  placeholder="Enter your message"
                  rows={6}
                  required={!formData.templateType || formData.templateType === 'custom'}
                />
              </div>
            </>
          )}

          {formData.templateType && formData.templateType !== 'custom' && (
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-700">
                Using template: <strong>
                  {formData.templateType === 'leadFollowUp' ? 'Follow-up Email' : 'Welcome Email'}
                </strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                This will send a pre-designed email with personalized content.
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
                'Send Email'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}