'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportLeadsModal({ isOpen, onClose, onSuccess }: ImportLeadsModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
    preview?: any[];
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        setError('Please select a CSV or Excel file');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      setImportResults(null);
      setShowPreview(false);
      setPreviewData([]);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      setError('Please select a file to preview');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('preview', 'true');

      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setPreviewData(data.preview || []);
        setShowPreview(true);
      } else {
        setError(data.message || 'Preview failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file to import');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setImportResults(data);
        if (data.success > 0) {
          onSuccess();
        }
      } else {
        setError(data.message || 'Import failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError('');
    setImportResults(null);
    setShowPreview(false);
    setPreviewData([]);
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = `Customer Name,Mobile Number,Product Name,Product Price,Sale Price,Source,Status
John Doe,+1-555-123-4567,Engine Block,2500,3000,Website,new
Jane Smith,+1-555-987-6543,Transmission,1800,2200,Referral,in-progress`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Leads</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple leads at once.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!importResults && !showPreview && (
            <>
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadTemplate}
                    size="sm"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Template
                  </Button>
                </div>
                {selectedFile && (
                  <p className="text-sm text-green-600">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">File Format Requirements:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• CSV or Excel file (.csv, .xlsx, .xls)</li>
                  <li>• Required columns: Customer Name, Mobile Number</li>
                  <li>• Optional columns: Product Name, Product Price, Sale Price, Source, Status</li>
                  <li>• Mobile numbers must be unique</li>
                  <li>• Download template for correct format</li>
                </ul>
              </div>
            </>
          )}

          {showPreview && !importResults && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Preview Data ({previewData.length} rows):</h4>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Customer Name</th>
                        <th className="text-left p-2">Mobile Number</th>
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Price</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{row.customerName}</td>
                          <td className="p-2">{row.mobileNumber}</td>
                          <td className="p-2">{row.productName || '-'}</td>
                          <td className="p-2">{row.productPrice ? `$${row.productPrice}` : '-'}</td>
                          <td className="p-2">{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <p className="text-xs text-gray-500 mt-2">... and {previewData.length - 10} more rows</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {importResults && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="font-medium text-green-900 mb-2">Import Results:</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p>✅ Successfully imported: {importResults.success} leads</p>
                  {importResults.failed > 0 && (
                    <p>❌ Failed to import: {importResults.failed} leads</p>
                  )}
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-md">
                  <h4 className="font-medium text-red-900 mb-2 flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Import Errors:
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {importResults.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {importResults.errors.length > 5 && (
                      <li>• ... and {importResults.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {importResults ? 'Close' : 'Cancel'}
          </Button>
          {!importResults && !showPreview && selectedFile && (
            <Button 
              onClick={handlePreview} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Loading...' : 'Preview'}
            </Button>
          )}
          {showPreview && !importResults && (
            <Button 
              onClick={handleImport} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Leads
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}