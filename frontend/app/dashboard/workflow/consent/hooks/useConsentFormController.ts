'use client';

import { useState, useRef, useEffect, RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, ApiResponse } from '@/components/lib/api';
import jsPDF from 'jspdf';

// Define the shape of the form data state with cleaned-up fields
interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  procedure: string;
  consentDate: string;
  consentAcknowledged: boolean;
  risksUnderstood: boolean;
  questionsAnswered: boolean;
  financialConsent: boolean;
}

// Define the return type for the custom hook
interface UseConsentForm {
  formData: FormData;
  isDrawing: boolean;
  hasSignature: boolean;
  formProgress: number;
  currentStep: number;
  isSubmitting: boolean;
  message: string;
  handleInputChange: (field: keyof FormData, value: any) => void;
  startDrawing: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  draw: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  stopDrawing: () => void;
  clearSignature: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  isStepComplete: (step: number) => boolean;
}

/**
 * Custom hook to manage the state and logic for the ConsentForm.
 */
export const useConsentFormController = (canvasRef: RefObject<HTMLCanvasElement>): UseConsentForm => {
  const router = useRouter();

  // State for form data, signature, and UI flow
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    procedure: '', // Initialized to an empty string for the dropdown
    consentDate: '',
    consentAcknowledged: false,
    risksUnderstood: false,
    questionsAnswered: false,
    financialConsent: false
  });
  
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);
  const [formProgress, setFormProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Recalculate form progress whenever formData or hasSignature changes
  useEffect(() => {
    const totalFields = Object.keys(formData).length;
    const completedFields = Object.values(formData).filter(value => 
      typeof value === 'boolean' ? value : (typeof value === 'string' && value.trim() !== '')
    ).length;
    const signatureProgress = hasSignature ? 1 : 0;

    setFormProgress(Math.round(((completedFields + signatureProgress) / (totalFields + 1)) * 100));
  }, [formData, hasSignature]);

  // Handle changes to form inputs
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Logic for the signature pad
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };
  
  // Generate PDF from form data
  const generateConsentPDF = (): Blob => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Header
      pdf.setFontSize(18);
      pdf.text('Patient Consent Form', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Patient Information
      pdf.setFontSize(14);
      pdf.text('Patient Information:', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Name: ${formData.firstName} ${formData.lastName}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Date of Birth: ${formData.dateOfBirth}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Phone: ${formData.phone}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Email: ${formData.email}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Procedure: ${formData.procedure}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Consent Date: ${formData.consentDate}`, 20, yPosition);
      yPosition += 15;

      // Consent Acknowledgments
      pdf.setFontSize(14);
      pdf.text('Consent Acknowledgments:', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text(`✓ Treatment Acknowledged: ${formData.consentAcknowledged ? 'Yes' : 'No'}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`✓ Risks Understood: ${formData.risksUnderstood ? 'Yes' : 'No'}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`✓ Media Consent: ${formData.questionsAnswered ? 'Yes' : 'No'}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`✓ Media Delivery Consent: ${formData.financialConsent ? 'Yes' : 'No'}`, 20, yPosition);
      yPosition += 15;

      // Signature
      if (canvasRef.current && hasSignature) {
        try {
          pdf.setFontSize(14);
          pdf.text('Electronic Signature:', 20, yPosition);
          yPosition += 10;
          
          const signatureData = canvasRef.current.toDataURL('image/png');
          pdf.addImage(signatureData, 'PNG', 20, yPosition, 100, 30);
        } catch (signatureError) {
          console.warn('Failed to add signature to PDF:', signatureError);
          // Continue without signature if there's an error
        }
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('PDF generation error:', error);
      // Return a minimal PDF if generation fails
      const fallbackPdf = new jsPDF();
      fallbackPdf.text('Consent Form - Generation Error', 20, 20);
      return fallbackPdf.output('blob');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for all required fields including consentDate
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone 
        || !formData.dateOfBirth || !formData.procedure || !formData.consentDate) {
      setMessage('First name, last name, email, phone, date of birth, consent date, and procedure are required.');
      return;
    }

    if (!hasSignature) {
      setMessage('Please provide your signature to complete the consent form.');
      return;
    }

    if (!formData.consentAcknowledged || !formData.risksUnderstood || !formData.questionsAnswered || !formData.financialConsent) {
      setMessage('Please acknowledge all consent requirements.');
      return;
    }
    
    setMessage('');
    setIsSubmitting(true);
    
    try {
      const canvas = canvasRef.current;
      const signatureData = canvas ? canvas.toDataURL('image/png') : '';
      
      // Submit consent form first
      const response = await api.post<ApiResponse>('/consents', {
        ...formData,
        signatureData,
      });



      // Generate and upload PDF if consent was successful
      if (response.success && response.data?.patient_id) {
        const pdfBlob = generateConsentPDF();
        const pdfFile = new File([pdfBlob], `consent_${formData.firstName}_${formData.lastName}_${Date.now()}.pdf`, {
          type: 'application/pdf'
        });
        const uploadFormData = new FormData();
        uploadFormData.append('practiceId', response.data.practice_id || 'practice-1');
        uploadFormData.append('patientId', response.data.patient_id);
        uploadFormData.append('patientPhotoId', response.data.patient_id);
        uploadFormData.append('mediaFiles', pdfFile);
        uploadFormData.append('categories', 'before');
        uploadFormData.append('mediaTypes', 'pdf');
        
        try {
          await api.postFormData('/upload/media', uploadFormData);
        } catch (pdfError) {
          console.error('PDF upload failed:', pdfError);
          // Continue even if PDF upload fails
        }
      }

      // Store current session data for the waiting page
      const currentSession = {
        sessionId: response.data?.id || Date.now().toString(),
        patientId: response.data?.patient_id || '',
        patientName: `${formData.firstName} ${formData.lastName}`,
        procedure: formData.procedure,
        currentStep: 'waiting_for_photos',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('currentSession', JSON.stringify(currentSession));
      
      setMessage(response.message2 || 'Consent form submitted successfully!');
      router.push('/dashboard/workflow/waiting');
      
    } catch (error: any) {
      console.error('Submission failed:', error);
      if (error instanceof ApiError && error.responseBody) {
        setMessage(error.responseBody.message2 || 'An unknown API error occurred.');
      } else {
        setMessage(error.message || 'An unexpected error occurred during submission. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation logic
  const nextStep = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.dateOfBirth && formData.phone && formData.email && formData.procedure && formData.consentDate);
      case 2:
        return !!(formData.consentAcknowledged && formData.risksUnderstood && formData.questionsAnswered && formData.financialConsent && hasSignature);
      default:
        return false;
    }
  };

  // Return all state and functions
  return {
    formData,
    isDrawing,
    hasSignature,
    formProgress,
    currentStep,
    isSubmitting,
    message,
    handleInputChange,
    startDrawing,
    draw,
    stopDrawing,
    clearSignature,
    handleSubmit,
    nextStep,
    prevStep,
    isStepComplete
  };
};
