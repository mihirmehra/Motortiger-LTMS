'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Phone, Package, DollarSign, Globe, Target, UserCheck, Mail } from 'lucide-react';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddLeadModal({ isOpen, onClose, onSuccess }: AddLeadModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    email: '',
    productName: '',
    productPrice: '',
    salePrice: '',
    source: '',
    status: 'new',
    assignedTo: 'unassigned'
  });
  const [users, setUsers] = useState<Array<{ _id: string; name: string; email: string }>>([]);
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
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          ...formData,
          productPrice: formData.productPrice ? parseFloat(formData.productPrice) : null,
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
          assignedTo: formData.assignedTo === 'unassigned' ? null : (formData.assignedTo || (userRole === 'agent' ? userId : null))
        }),
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          customerName: '',
          mobileNumber: '',
          email: '',
          productName: '',
          productPrice: '',
          salePrice: '',
          source: '',
          status: 'new',
          assignedTo: 'unassigned'
        });
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create lead');
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <User className="mr-3 h-6 w-6 text-blue-600" />
            Add New Lead
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a new lead with customer information. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <User className="mr-2 h-5 w-5" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
                  Customer Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="Enter customer full name"
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700">
                  Mobile Number *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="mobileNumber"
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="customer@example.com (optional)"
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Product Information Section */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Product Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName" className="text-sm font-medium text-gray-700">
                  Product Name
                </Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    placeholder="Engine part name"
                    className="pl-10 h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productPrice" className="text-sm font-medium text-gray-700">
                  Product Price
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="productPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.productPrice}
                    onChange={(e) => handleInputChange('productPrice', e.target.value)}
                    placeholder="0.00"
                    className="pl-10 h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePrice" className="text-sm font-medium text-gray-700">
                  Sale Price
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="salePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => handleInputChange('salePrice', e.target.value)}
                    placeholder="0.00"
                    className="pl-10 h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lead Management Section */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Lead Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source" className="text-sm font-medium text-gray-700">
                  Lead Source
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    placeholder="Website, referral, etc."
                    className="pl-10 h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">🆕 New</SelectItem>
                    <SelectItem value="in-progress">⏳ In Progress</SelectItem>
                    <SelectItem value="sold">✅ Sold</SelectItem>
                    <SelectItem value="lost">❌ Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {userRole !== 'agent' && (
                <div className="space-y-2">
                  <Label htmlFor="assignedTo" className="text-sm font-medium text-gray-700">
                    Assign To
                  </Label>
                  <Select value={formData.assignedTo} onValueChange={(value) => handleInputChange('assignedTo', value)}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Select user (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        <div className="flex items-center">
                          <UserCheck className="mr-2 h-4 w-4 text-gray-400" />
                          Unassigned
                        </div>
                      </SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-blue-500" />
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Profit Calculation Display */}
          {formData.productPrice && formData.salePrice && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-800">Estimated Profit Margin:</span>
                <span className={`text-lg font-bold ${
                  (!isNaN(parseFloat(formData.salePrice)) && !isNaN(parseFloat(formData.productPrice)) && 
                   (parseFloat(formData.salePrice) - parseFloat(formData.productPrice)) > 0)
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  ${(!isNaN(parseFloat(formData.salePrice)) && !isNaN(parseFloat(formData.productPrice)) 
                    ? (parseFloat(formData.salePrice) - parseFloat(formData.productPrice)).toFixed(2)
                    : '0.00')}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="mr-3 px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Create Lead
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}