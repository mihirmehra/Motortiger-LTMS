'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  UserCircle, 
  LogOut, 
  X,
  TrendingUp,
  Mail,
  FileText,
  Settings,
  UsersIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'agent'] },
  { name: 'Leads', href: '/leads', icon: Users, roles: ['admin', 'manager', 'agent'] },
  { name: 'Targets', href: '/targets', icon: Target, roles: ['admin', 'manager'] },
  { name: 'Teams', href: '/teams', icon: UsersIcon, roles: ['admin', 'manager'] },
  { name: 'Users', href: '/users', icon: UserCircle, roles: ['admin', 'manager'] },
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['admin', 'manager'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [userRole, setUserRole] = useState('');
  const [mainTarget, setMainTarget] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const role = localStorage.getItem('user-role');
    setUserRole(role || '');
    
    // Fetch main target
    fetchMainTarget();
  }, []);

  const fetchMainTarget = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/targets/main', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMainTarget(data.total || 0);
      } else {
        console.error('Failed to fetch main target:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching main target:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-role');
    localStorage.removeItem('user-id');
    router.push('/');
  };

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">LTM System</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Target Display */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Main Target</p>
            <p className="text-2xl font-bold text-blue-600">${mainTarget.toLocaleString()}</p>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs text-green-600">Active</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-6 space-y-2 custom-scrollbar overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                  isActive
                    ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
                onClick={() => onClose()}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-blue-700" : "text-gray-400"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userRole.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 capitalize">{userRole}</p>
              <p className="text-xs text-gray-500">Active User</p>
            </div>
          </div>
          
          <Button 
            onClick={handleLogout}
            variant="outline" 
            size="sm" 
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}