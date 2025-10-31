import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  invoice_no: string;
  date: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    total: number;
  }[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  payment_type?: string;
  payment_status?: string;
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

export const generateInvoicePDF = (
  invoiceData: InvoiceData,
  companyInfo?: CompanyInfo
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Default company info
  const company = companyInfo || {
    name: 'Sharkar Feed & Medicine',
    address: '123 Main Street, City, Country',
    phone: '+1234567890',
    email: 'info@sharkarfeed.com',
  };

  // Header - Company Info
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(company.address, pageWidth / 2, 28, { align: 'center' });
  doc.text(`Phone: ${company.phone} | Email: ${company.email}`, pageWidth / 2, 34, { align: 'center' });
  
  // Line separator
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(15, 40, pageWidth - 15, 40);
  
  // Invoice Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES INVOICE', pageWidth / 2, 50, { align: 'center' });
  
  // Invoice Details - Left Side
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No:', 15, 62);
  doc.text('Date:', 15, 70);
  
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.invoice_no, 50, 62);
  doc.text(new Date(invoiceData.date).toLocaleDateString(), 50, 70);
  
  // Customer Details - Right Side
  if (invoiceData.customer_name) {
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', pageWidth - 85, 62);
    
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.customer_name, pageWidth - 85, 70);
    if (invoiceData.customer_phone) {
      doc.text(`Phone: ${invoiceData.customer_phone}`, pageWidth - 85, 78);
    }
    if (invoiceData.customer_address) {
      const addressLines = doc.splitTextToSize(invoiceData.customer_address, 70);
      doc.text(addressLines, pageWidth - 85, 86);
    }
  }
  
  // Items Table
  const tableStartY = invoiceData.customer_address ? 100 : 85;
  
  autoTable(doc, {
    startY: tableStartY,
    head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Discount', 'Total']],
    body: invoiceData.items.map((item, index) => [
      (index + 1).toString(),
      item.product_name,
      item.quantity.toString(),
      `$${item.unit_price.toFixed(2)}`,
      item.discount ? `$${item.discount.toFixed(2)}` : '-',
      `$${item.total.toFixed(2)}`,
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  });
  
  // Get the final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 50;
  
  // Summary Section
  const summaryX = pageWidth - 70;
  let summaryY = finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Subtotal
  doc.text('Subtotal:', summaryX, summaryY);
  doc.text(`$${invoiceData.subtotal.toFixed(2)}`, summaryX + 40, summaryY, { align: 'right' });
  summaryY += 8;
  
  // Discount (if any)
  if (invoiceData.discount && invoiceData.discount > 0) {
    doc.text('Discount:', summaryX, summaryY);
    doc.text(`-$${invoiceData.discount.toFixed(2)}`, summaryX + 40, summaryY, { align: 'right' });
    summaryY += 8;
  }
  
  // Tax (if any)
  if (invoiceData.tax && invoiceData.tax > 0) {
    doc.text('Tax:', summaryX, summaryY);
    doc.text(`$${invoiceData.tax.toFixed(2)}`, summaryX + 40, summaryY, { align: 'right' });
    summaryY += 8;
  }
  
  // Line before total
  doc.setLineWidth(0.3);
  doc.line(summaryX, summaryY, summaryX + 40, summaryY);
  summaryY += 6;
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', summaryX, summaryY);
  doc.text(`$${invoiceData.total.toFixed(2)}`, summaryX + 40, summaryY, { align: 'right' });
  
  // Payment Info
  if (invoiceData.payment_type || invoiceData.payment_status) {
    summaryY += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (invoiceData.payment_type) {
      doc.text(`Payment Method: ${invoiceData.payment_type}`, summaryX, summaryY);
      summaryY += 6;
    }
    
    if (invoiceData.payment_status) {
      doc.text(`Status: ${invoiceData.payment_status}`, summaryX, summaryY);
    }
  }
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, footerY + 5, { align: 'center' });
  
  // Page number
  doc.text(`Page 1 of 1`, pageWidth - 20, footerY + 10, { align: 'right' });
  
  return doc;
};

export const downloadInvoicePDF = (invoiceData: InvoiceData, companyInfo?: CompanyInfo) => {
  const doc = generateInvoicePDF(invoiceData, companyInfo);
  doc.save(`invoice-${invoiceData.invoice_no}.pdf`);
};

export const printInvoicePDF = (invoiceData: InvoiceData, companyInfo?: CompanyInfo) => {
  const doc = generateInvoicePDF(invoiceData, companyInfo);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

export const emailInvoicePDF = async (
  invoiceData: InvoiceData,
  recipientEmail: string,
  companyInfo?: CompanyInfo
) => {
  const doc = generateInvoicePDF(invoiceData, companyInfo);
  const pdfBlob = doc.output('blob');
  
  // This would need to be implemented with your backend email service
  // For now, we'll just return the blob
  return {
    blob: pdfBlob,
    filename: `invoice-${invoiceData.invoice_no}.pdf`,
    recipientEmail,
  };
};

