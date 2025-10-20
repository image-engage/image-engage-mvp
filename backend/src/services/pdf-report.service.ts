import PDFDocument = require('pdfkit');
import fs from 'fs';
import path from 'path';
import { supabase } from '../config/database';

interface ReportData {
  patientName: string;
  patientId: string;
  treatmentDate: string;
  beforeImages: string[];
  afterImages: string[];
  annotations?: any[];
  clinicInfo: {
    name: string;
    address: string;
    phone: string;
  };
}

export class PDFReportService {
  async generatePatientReport(reportData: ReportData): Promise<string> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const reportPath = path.join(process.cwd(), 'uploads', `report_${reportData.patientId}_${Date.now()}.pdf`);
    
    doc.pipe(fs.createWriteStream(reportPath));

    // Header
    doc.fontSize(20).text(reportData.clinicInfo.name, { align: 'center' });
    doc.fontSize(12).text(reportData.clinicInfo.address, { align: 'center' });
    doc.text(reportData.clinicInfo.phone, { align: 'center' });
    doc.moveDown(2);

    // Title
    doc.fontSize(18).text('Treatment Documentation Report', { align: 'center' });
    doc.moveDown();

    // Patient Info
    doc.fontSize(14).text(`Patient: ${reportData.patientName}`);
    doc.text(`Patient ID: ${reportData.patientId}`);
    doc.text(`Treatment Date: ${reportData.treatmentDate}`);
    doc.moveDown();

    // Before Images Section
    if (reportData.beforeImages.length > 0) {
      doc.fontSize(16).text('Before Treatment', { underline: true });
      doc.moveDown();
      
      await this.addImagesToReport(doc, reportData.beforeImages, 'Before');
    }

    // After Images Section
    if (reportData.afterImages.length > 0) {
      doc.addPage();
      doc.fontSize(16).text('After Treatment', { underline: true });
      doc.moveDown();
      
      await this.addImagesToReport(doc, reportData.afterImages, 'After');
    }

    // Footer
    doc.fontSize(10).text(`Generated on ${new Date().toLocaleDateString()}`, 50, doc.page.height - 50);

    doc.end();

    return reportPath;
  }

  private async addImagesToReport(doc: typeof PDFDocument, imagePaths: string[], section: string): Promise<void> {
    const imagesPerRow = 2;
    const imageWidth = 200;
    const imageHeight = 150;
    const margin = 50;
    
    for (let i = 0; i < imagePaths.length; i++) {
      const x = margin + (i % imagesPerRow) * (imageWidth + 20);
      const y = doc.y + Math.floor(i / imagesPerRow) * (imageHeight + 30);
      
      if (y > doc.page.height - imageHeight - 100) {
        doc.addPage();
      }
      
      try {
        if (fs.existsSync(imagePaths[i])) {
          doc.image(imagePaths[i], x, y, { width: imageWidth, height: imageHeight });
          doc.fontSize(10).text(`${section} ${i + 1}`, x, y + imageHeight + 5);
        }
      } catch (error) {
        console.error(`Error adding image ${imagePaths[i]}:`, error);
      }
    }
  }

  async generateComparisonReport(patientConsentId: string): Promise<string> {
    // Fetch patient data and media
    const { data: consent } = await supabase
      .from('patient_consents')
      .select('*')
      .eq('id', patientConsentId)
      .single();

    const { data: media } = await supabase
      .from('patient_media')
      .select('*')
      .eq('patientConsentId', patientConsentId)
      .order('uploadDate', { ascending: true });

    if (!consent || !media) {
      throw new Error('Patient data not found');
    }

    const beforeImages = media.filter(m => m.mediaCategory === 'before').map(m => m.filePath);
    const afterImages = media.filter(m => m.mediaCategory === 'after').map(m => m.filePath);

    const reportData: ReportData = {
      patientName: `${consent.firstName} ${consent.lastName}`,
      patientId: consent.id,
      treatmentDate: new Date(consent.createdAt).toLocaleDateString(),
      beforeImages,
      afterImages,
      clinicInfo: {
        name: 'Image Engage Clinic',
        address: '123 Dental Street, City, State 12345',
        phone: '(555) 123-4567'
      }
    };

    return this.generatePatientReport(reportData);
  }
}