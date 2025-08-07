'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, Mail, CheckCircle } from 'lucide-react';

interface Activity {
  id: string;
  type: 'lead_created' | 'lead_updated' | 'email_sent' | 'target_achieved';
  description: string;
  time: string;
  user: string;
}

export default function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/dashboard/activities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      } else {
        console.error('Failed to fetch activities:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Set empty activities on error
      setActivities([]);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead_created':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'lead_updated':
        return <Phone className="h-4 w-4 text-yellow-600" />;
      case 'email_sent':
        return <Mail className="h-4 w-4 text-green-600" />;
      case 'target_achieved':
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'lead_created':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">New</Badge>;
      case 'lead_updated':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Updated</Badge>;
      case 'email_sent':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Email</Badge>;
      case 'target_achieved':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Achievement</Badge>;
      default:
        return <Badge variant="secondary">Activity</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.description}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">by {activity.user}</p>
                  <div className="flex items-center space-x-2">
                    {getActivityBadge(activity.type)}
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}