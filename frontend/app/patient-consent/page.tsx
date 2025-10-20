'use client';

import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, PenTool, AlertTriangle, CheckCircle2, User, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
// Updated import path to match the multi-step form
import { useConsentFormController } from '../dashboard/workflow/consent/hooks/useConsentFormController';
import { api } from '@/components/lib/api';

export default function SinglePageConsentForm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [practiceInfo, setPracticeInfo] = useState<any>(null);
  const [tokenValid, setTokenValid] = useState<boolean>(true);
  
  // Using the same hook as the multi-step form to ensure same API calls
  const { 
    formData,
    isDrawing,
    hasSignature,
    isSubmitting,
    message,
    handleInputChange,
    startDrawing,
    draw,
    stopDrawing,
    clearSignature,
    handleSubmit,
    // Adding these properties that might be used by the hook internally
    formProgress,
    currentStep,
    nextStep,
    prevStep,
    isStepComplete
  } = useConsentFormController(canvasRef);
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Validate session token and get practice info
    const validateSession = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('session') || urlParams.get('token');
      
      if (!token) {
        setTokenValid(false);
        return;
      }
      
      setSessionToken(token);
      
      try {
        const response = await api.get(`/sessions/validate/${token}`) as { success: boolean; data?: { practice: any } };
        if (response.success && response.data) {
          setPracticeInfo(response.data.practice);
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        // Fallback: Allow form to work for now
        console.log('Using fallback - allowing form access');
        setTokenValid(true);
        setPracticeInfo({ name: 'Demo Practice' });
      }
    };
    
    validateSession();
  }, []);

  // Helper function to check if all required fields are filled
  const isFormComplete = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      formData.consentDate &&
      formData.dateOfBirth &&
      formData.phone &&
      formData.email &&
      formData.procedure &&
      formData.consentAcknowledged &&
      formData.risksUnderstood &&
      formData.questionsAnswered &&
      formData.financialConsent &&
      hasSignature
    );
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mr-2" />
        <p className="text-xl text-gray-500">Loading form...</p>
      </div>
    );
  }
  
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-200">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-gray-600 mb-4">This consent form link has expired or is invalid.</p>
          <p className="text-sm text-gray-500">Please ask staff for a new QR code.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28"> {/* Added padding bottom for sticky footer */}
      {/* Header - Sticking to the top */}
      <header className="bg-white border-b border-blue-200 shadow-lg sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/workflow">
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Staff Home
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Patient Consent Form</h1>
                <p className="text-sm text-gray-600">Please complete all required fields below to proceed.</p>
              </div>
            </div>
            <Badge className="bg-blue-600 text-white font-semibold">
              <Shield className="h-3 w-3 mr-1" />
              Secure Form
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Error Message Display - Enhanced */}
          {message && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md">
              <p className="font-semibold flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Submission Error
              </p>
              <p className="ml-7 text-sm">{message}</p>
            </div>
          )}
          
          {/* Patient Information Section */}
          <Card className="shadow-xl border-t-4 border-blue-600">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2 text-blue-800">
                <User className="h-6 w-6" />
                1. Patient & Procedure Information
              </CardTitle>
              <CardDescription>
                Ensure all required personal details and the correct procedure are selected.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth <span className="text-red-500">*</span></Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    required
                  />
                </div>
                {/* Date of Consent */}
                <div className="space-y-2">
                  <Label htmlFor="consentDate">Date of Consent <span className="text-red-500">*</span></Label>
                  <Input
                    id="consentDate"
                    type="date"
                    value={formData.consentDate}
                    onChange={(e) => handleInputChange('consentDate', e.target.value)}
                    required
                  />
                </div>
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>
              {/* Procedure Select */}
              <div className="space-y-2">
                <Label htmlFor="procedure">Scheduled Procedure <span className="text-red-500">*</span></Label>
                <Select onValueChange={(value) => handleInputChange('procedure', value)} value={formData.procedure}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a procedure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dental Implant Consultation">Dental Implant Consultation</SelectItem>
                    <SelectItem value="Teeth Whitening">Teeth Whitening</SelectItem>
                    <SelectItem value="Root Canal Therapy">Root Canal Therapy</SelectItem>
                    <SelectItem value="Orthodontic Evaluation">Orthodontic Evaluation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Informed Consent Section */}
          <Card className="shadow-xl border-t-4 border-orange-600">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-6 w-6" />
                2. Informed Consent & Media Release
              </CardTitle>
              <CardDescription>
                Review the document carefully and confirm your understanding and agreement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Consent Text Block */}
              <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                <h3 className="font-bold text-lg text-orange-900 mb-3 border-b pb-2 border-orange-200">
                    Consent to Use of Dental Photographs and Videos
                </h3>
                <div className="space-y-3 text-sm text-orange-800">
                  <p>
                    I hereby consent to the taking of dental photographs and/or videos of my face, mouth, and/or teeth, before, during, and after my treatment at this dental practice.
                  </p>
                  <p className="font-semibold">
                    I grant the practice the irrevocable right to use these images and videos, with or without my name, for purposes including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-4">
                    <li>Treatment planning, analysis, and documentation.</li>
                    <li>Educational purposes for other dental professionals.</li>
                    <li>Marketing and promotional materials for the dental practice (e.g., website, social media, brochures).</li>
                  </ul>
                  <p className="text-xs text-gray-600 mt-3">
                    I understand I will not be compensated. I release the practice from all claims related to this usage. This consent is valid indefinitely unless revoked in writing.
                  </p>
                </div>
              </div>

              {/* Consent Checkboxes - Clearer Grouping */}
              <div className="space-y-5 p-4 border rounded-xl bg-white shadow-sm">
                <h4 className="font-semibold text-gray-800 border-b pb-2 mb-3">Your Acknowledgments <span className="text-red-500">*</span></h4>
                
                {/* 1. Treatment Acknowledged */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consentAcknowledged"
                    checked={formData.consentAcknowledged}
                    onCheckedChange={(checked) => handleInputChange('consentAcknowledged', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="consentAcknowledged" className="text-sm leading-relaxed cursor-pointer">
                    I acknowledge that I have read and understood the nature of the proposed treatment, including its purpose and what it involves.
                  </Label>
                </div>
                
                {/* 2. Risks Understood / Questions Answered */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="risksUnderstood" // Retaining original ID for hook compatibility
                    checked={formData.risksUnderstood}
                    onCheckedChange={(checked) => handleInputChange('risksUnderstood', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="risksUnderstood" className="text-sm leading-relaxed cursor-pointer">
                    I have had the opportunity to ask questions, and all my questions have been answered to my satisfaction regarding risks and benefits.
                  </Label>
                </div>
                
                {/* 3. Photos/Videos Shared - Media Release */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="questionsAnswered" // Retaining original ID for hook compatibility (Media Consent)
                    checked={formData.questionsAnswered}
                    onCheckedChange={(checked) => handleInputChange('questionsAnswered', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="questionsAnswered" className="text-sm leading-relaxed cursor-pointer">
                    I consent to have my photos and videos **shared publicly or privately** with the dental practice and its authorized representatives for purposes mentioned above.
                  </Label>
                </div>
                
                {/* 4. Financial Consent - Media Delivery */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="financialConsent" // Retaining original ID for hook compatibility (Media Delivery)
                    checked={formData.financialConsent}
                    onCheckedChange={(checked) => handleInputChange('financialConsent', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="financialConsent" className="text-sm leading-relaxed cursor-pointer">
                    I consent to **receive and view** photos and videos from the dental practice via text and email for my own records.
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Electronic Signature Section */}
          <Card className="shadow-xl border-t-4 border-purple-600">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2 text-purple-800">
                <PenTool className="h-6 w-6" />
                3. Electronic Signature
              </CardTitle>
              <CardDescription>
                Your signature confirms your acceptance of all terms above.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-purple-300 rounded-xl p-2 bg-white shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full h-40 border-none rounded cursor-crosshair touch-none bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{ touchAction: 'none' }}
                />
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className={`text-sm font-medium flex items-center gap-2 ${hasSignature ? 'text-green-600' : 'text-gray-600'}`}>
                    {hasSignature 
                        ? <><CheckCircle2 className="h-5 w-5" /> Signature Captured</>
                        : <span className="text-red-500">Signature Required *</span>
                    }
                </p>
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  onClick={clearSignature}
                  className="text-purple-600 border border-purple-200 hover:bg-purple-50"
                >
                  Clear Signature
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                By signing above, I consent to the treatment and acknowledge that I have read and understood this consent form.
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
      
      {/* STICKY SUBMIT FOOTER */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.1)] z-30">
          <div className="max-w-4xl mx-auto">
            <Button 
              type="submit" 
              onClick={handleSubmit} // Use onClick with type="submit" in the form
              disabled={!isFormComplete() || isSubmitting}
              className={`w-full h-12 text-lg font-bold transition-all ${
                  isFormComplete() ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <><Loader2 className="h-5 w-5 mr-3 animate-spin" /> Submitting Consent...</>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-3" />
                  Complete & Submit Form
                </>
              )}
            </Button>
            {!isFormComplete() && (
                <p className="text-center text-red-600 text-sm mt-2">
                    Please complete all required fields and provide a signature to submit.
                </p>
            )}
          </div>
      </div>
    </div>
  );
}