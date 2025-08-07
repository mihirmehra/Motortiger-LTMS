'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Target, Mail, FileDown, FileUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickActionsProps {
  userRole: string;
}

export default function QuickActions({ userRole }: QuickActionsProps) {
  const router = useRouter();

  const adminActions = [
    { label: 'Add New Lead', icon: Plus, action: () => router.push('/leads'), color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Manage Users', icon: Users, action: () => router.push('/users'), color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Set Targets', icon: Target, action: () => router.push('/targets'), color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'View Reports', icon: Mail, action: () => router.push('/reports'), color: 'bg-yellow-600 hover:bg-yellow-700' },
    { label: 'Export Data', icon: FileDown, action: () => router.push('/leads'), color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'Import Leads', icon: FileUp, action: () => router.push('/leads'), color: 'bg-pink-600 hover:bg-pink-700' }
  ];

  const managerActions = [
    { label: 'Add New Lead', icon: Plus, action: () => router.push('/leads'), color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Manage Team', icon: Users, action: () => router.push('/users'), color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Set Targets', icon: Target, action: () => router.push('/targets'), color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'View Reports', icon: Mail, action: () => router.push('/reports'), color: 'bg-yellow-600 hover:bg-yellow-700' }
  ];

  const agentActions = [
    { label: 'Add New Lead', icon: Plus, action: () => router.push('/leads'), color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'My Leads', icon: Users, action: () => router.push('/leads'), color: 'bg-green-600 hover:bg-green-700' },
    { label: 'View Targets', icon: Target, action: () => router.push('/targets'), color: 'bg-yellow-600 hover:bg-yellow-700' }
  ];

  const getActionsForRole = () => {
    switch (userRole) {
      case 'admin':
        return adminActions;
      case 'manager':
        return managerActions;
      case 'agent':
        return agentActions;
      default:
        return [];
    }
  };

  const actions = getActionsForRole();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => (
            <Button
              key={action.label}
              onClick={action.action}
              className={`justify-start h-12 ${action.color} text-white animate-slide-in`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <action.icon className="mr-3 h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}