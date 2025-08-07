'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, Database, Mail } from 'lucide-react';

export default function SettingsPage() {
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('user-role');
    setUserRole(role || '');
  }, []);

  // Check if user can access settings
  const canAccessSettings = userRole === 'admin';

  if (!canAccessSettings) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access settings.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage system configuration and preferences</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">System Status</p>
                  <p className="text-2xl font-bold">Online</p>
                </div>
                <Settings className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Security</p>
                  <p className="text-2xl font-bold">Secure</p>
                </div>
                <Shield className="h-8 w-8 text-green-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">Database</p>
                  <p className="text-2xl font-bold">Connected</p>
                </div>
                <Database className="h-8 w-8 text-yellow-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Email Service</p>
                  <p className="text-2xl font-bold">Active</p>
                </div>
                <Mail className="h-8 w-8 text-purple-200" />
              </div>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Settings Configuration</CardTitle>
            <CardDescription>
              System settings are managed by administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Settings functionality is available for system administrators. 
              Contact your system administrator for configuration changes.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}