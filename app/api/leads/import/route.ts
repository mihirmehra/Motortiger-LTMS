import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { authenticateUser, checkPermission } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!checkPermission(user, 'create', 'leads')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isPreview = formData.get('preview') === 'true';
    
    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Read file content
    const fileContent = await file.text();
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ message: 'File must contain at least a header and one data row' }, { status: 400 });
    }

    // Parse CSV header
    const header = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));
    const dataLines = lines.slice(1);

    // Validate required columns
    const requiredColumns = ['Customer Name', 'Mobile Number'];
    const missingColumns = requiredColumns.filter(col => !header.includes(col));
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        message: `Missing required columns: ${missingColumns.join(', ')}` 
      }, { status: 400 });
    }

    // If preview mode, just return parsed data
    if (isPreview) {
      const previewData = [];
      
      for (let i = 0; i < Math.min(dataLines.length, 50); i++) {
        const values = dataLines[i].split(',').map(val => val.trim().replace(/"/g, ''));
        
        if (values.length !== header.length) continue;

        const leadData: any = {};
        
        header.forEach((col, index) => {
          const value = values[index];
          switch (col) {
            case 'Customer Name':
              leadData.customerName = value;
              break;
            case 'Mobile Number':
              leadData.mobileNumber = value;
              break;
            case 'Product Name':
              leadData.productName = value || '';
              break;
            case 'Product Price':
              leadData.productPrice = value ? parseFloat(value) : null;
              break;
            case 'Sale Price':
              leadData.salePrice = value ? parseFloat(value) : null;
              break;
            case 'Source':
              leadData.source = value || '';
              break;
            case 'Status':
              const status = value.toLowerCase();
              leadData.status = ['new', 'in-progress', 'sold', 'lost'].includes(status) ? status : 'new';
              break;
          }
        });

        if (leadData.customerName && leadData.mobileNumber) {
          previewData.push(leadData);
        }
      }

      return NextResponse.json({ preview: previewData });
    }

    const results: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < dataLines.length; i++) {
      const rowNumber = i + 2; // +2 because we start from line 2 (after header)
      const values = dataLines[i].split(',').map(val => val.trim().replace(/"/g, ''));
      
      if (values.length !== header.length) {
        results.failed++;
        results.errors.push(`Row ${rowNumber}: Column count mismatch`);
        continue;
      }

      // Create lead object from CSV data
      const leadData: any = {};
      
      header.forEach((col, index) => {
        const value = values[index];
        switch (col) {
          case 'Customer Name':
            leadData.customerName = value;
            break;
          case 'Mobile Number':
            leadData.mobileNumber = value;
            break;
          case 'Product Name':
            leadData.productName = value || undefined;
            break;
          case 'Product Price':
            leadData.productPrice = value ? parseFloat(value) : undefined;
            break;
          case 'Sale Price':
            leadData.salePrice = value ? parseFloat(value) : undefined;
            break;
          case 'Source':
            leadData.source = value || undefined;
            break;
          case 'Status':
            const status = value.toLowerCase();
            if (['new', 'in-progress', 'sold', 'lost'].includes(status)) {
              leadData.status = status;
            } else {
              leadData.status = 'new';
            }
            break;
        }
      });

      // Validate required fields
      if (!leadData.customerName || !leadData.mobileNumber) {
        results.failed++;
        results.errors.push(`Row ${rowNumber}: Missing customer name or mobile number`);
        continue;
      }

      // Validate mobile number format (basic validation)
      const mobileRegex = /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
      if (!mobileRegex.test(leadData.mobileNumber)) {
        results.failed++;
        results.errors.push(`Row ${rowNumber}: Invalid mobile number format`);
        continue;
      }

      try {
        // Check if mobile number already exists
        const existingLead = await Lead.findOne({ mobileNumber: leadData.mobileNumber });
        if (existingLead) {
          results.failed++;
          results.errors.push(`Row ${rowNumber}: Mobile number ${leadData.mobileNumber} already exists`);
          continue;
        }

        // Create new lead
        const newLead = new Lead({
          ...leadData,
          assignedTo: user._id,
          createdBy: user._id
        });

        await newLead.save();
        results.success++;
      } catch (error:any) {
        results.failed++;
        results.errors.push(`Row ${rowNumber}: ${(error instanceof Error ? error.message : String(error))}`);
      }
    }

    return NextResponse.json(results);
  } catch (error:any) {
    console.error('Error importing leads:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}