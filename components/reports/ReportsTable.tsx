'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// --- Types ---
interface AssignedTo {
  name: string;
  // Add other fields if needed
}

interface Lead {
  assignedTo: AssignedTo | null | undefined | string;
  status: 'new' | 'in-progress' | 'sold' | 'lost' | string;
  profitMargin?: number;
  // Add other fields if needed
}

interface Sale {
  customerName: string;
  productName?: string | null;
  profitMargin?: number;
  createdAt: string;
  assignedTo: AssignedTo | null | undefined | string;
  // Add other fields if needed
}

interface ReportsTableData {
  leads: Lead[];
  sales: Sale[];
}

interface ReportsTableProps {
  data: ReportsTableData;
  isLoading: boolean;
}

interface Performer {
  name: string;
  leads: number;
  sales: number;
  revenue: number;
  conversion: number | string; // string because toFixed returns string
}

interface RecentSale {
  customer: string;
  product: string;
  amount: number;
  date: string;
  agent: string;
}

interface ProcessedData {
  topPerformers: Performer[];
  recentSales: RecentSale[];
}

// --- Component ---
export default function ReportsTable({ data, isLoading }: ReportsTableProps) {
  const [processedData, setProcessedData] = useState<ProcessedData>({
    topPerformers: [],
    recentSales: [],
  });

  useEffect(() => {
    if (data && data.leads) {
      processTableData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const processTableData = () => {
    // Process top performers from leads data
    const performerMap: Record<string, Performer> = {};

    data.leads.forEach((lead) => {
      const agentName =
        typeof lead.assignedTo === 'object' && lead.assignedTo !== null
          ? lead.assignedTo.name
          : 'Unknown';

      if (!performerMap[agentName]) {
        performerMap[agentName] = { name: agentName, leads: 0, sales: 0, revenue: 0, conversion: 0 };
      }
      performerMap[agentName].leads++;
      if (lead.status === 'sold') {
        performerMap[agentName].sales++;
        performerMap[agentName].revenue += lead.profitMargin ?? 0;
      }
    });

    const topPerformers = Object.values(performerMap)
      .map((performer) => ({
        ...performer,
        conversion:
          performer.leads > 0
            ? ((performer.sales / performer.leads) * 100).toFixed(1)
            : '0',
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Process recent sales
    const recentSales: RecentSale[] = (data.sales || [])
      .slice() // clone array to avoid mutating original
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((sale) => ({
        customer: sale.customerName,
        product: sale.productName ?? 'N/A',
        amount: sale.profitMargin ?? 0,
        date: sale.createdAt,
        agent:
          typeof sale.assignedTo === 'object' && sale.assignedTo !== null
            ? sale.assignedTo.name
            : 'Unknown',
      }));

    setProcessedData({ topPerformers, recentSales });
  };

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
                {topPerformers.map((performer, index) => {
                  // conversion is string from toFixed, convert to number for badge
                  const conversionRate = Number(performer.conversion);
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{performer.name}</TableCell>
                      <TableCell>{performer.leads}</TableCell>
                      <TableCell>{performer.sales}</TableCell>
                      <TableCell>${performer.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{performer.conversion}%</span>
                          {getConversionBadge(conversionRate)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
