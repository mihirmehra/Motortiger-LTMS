'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ReportsTableProps {
  data: any;
  isLoading: boolean;
}

export default function ReportsTable({ data, isLoading }: ReportsTableProps) {
  const [processedData, setProcessedData] = useState({
    topPerformers: [],
    recentSales: []
  });

  useEffect(() => {
    if (data && data.leads) {
      processTableData();
    }
  }, [data]);

  const processTableData = () => {
    // Process top performers from leads data
    const performerMap = {};
    
    data.leads.forEach(lead => {
      const agentName = typeof lead.assignedTo === 'object' ? lead.assignedTo.name : 'Unknown';
      if (!performerMap[agentName]) {
        performerMap[agentName] = { name: agentName, leads: 0, sales: 0, revenue: 0 };
      }
      performerMap[agentName].leads++;
      if (lead.status === 'sold') {
        performerMap[agentName].sales++;
        performerMap[agentName].revenue += lead.profitMargin || 0;
      }
    });

    const topPerformers = Object.values(performerMap).map(performer => ({
      ...performer,
      conversion: performer.leads > 0 ? ((performer.sales / performer.leads) * 100).toFixed(1) : 0
    })).sort((a, b) => b.sales - a.sales).slice(0, 5);

    // Process recent sales
    const recentSales = data.sales
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(sale => ({
        customer: sale.customerName,
        product: sale.productName || 'N/A',
        amount: sale.profitMargin || 0,
        date: sale.createdAt,
        agent: typeof sale.assignedTo === 'object' ? sale.assignedTo.name : 'Unknown'
      }));

    setProcessedData({ topPerformers, recentSales });
  };

  // Mock data for the table
  const topPerformers = processedData.topPerformers;
  const recentSales = processedData.recentSales;

  const getConversionBadge = (rate: number) => {
    if (rate >= 35) {
      return <Badge className="bg-green-100 text-green-700">Excellent</Badge>;
    } else if (rate >= 25) {
      return <Badge className="bg-blue-100 text-blue-700">Good</Badge>;
    } else if (rate >= 15) {
      return <Badge className="bg-yellow-100 text-yellow-700">Average</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-700">Needs Improvement</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((performer, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{performer.name}</TableCell>
                    <TableCell>{performer.leads}</TableCell>
                    <TableCell>{performer.sales}</TableCell>
                    <TableCell>${performer.revenue.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{performer.conversion}%</span>
                        {getConversionBadge(performer.conversion)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{sale.customer}</TableCell>
                    <TableCell>{sale.product}</TableCell>
                    <TableCell>${sale.amount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                    <TableCell>{sale.agent}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}