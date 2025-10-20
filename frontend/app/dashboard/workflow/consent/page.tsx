'use client';

import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress-custom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, ArrowLeft, ArrowRight, PenTool, AlertTriangle, CheckCircle2, User } from 'lucide-react';
import Link from 'next/link';
import { useConsentFormController } from '../consent/hooks/useConsentFormController';

export default function ConsentForm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
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
  } = useConsentFormController(canvasRef);
  
  // New state to check if the component is mounted on the client
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true once the component has mounted
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show a loading state until the client-side render is ready
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <p className="text-xl text-gray-500 animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/workflow">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Digital Consent Form</h1>
                <p className="text-sm text-gray-600">Step {currentStep} of 2</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Shield className="h-3 w-3 mr-1" />
                HIPAA Secure
              </Badge>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={formProgress} className="h-2" />
            <p className="text-xs text-gray-600 mt-1">{formProgress}% Complete</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Custom Message Box */}
          {message && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
              <p className="font-semibold">Error</p>
              <p>{message}</p>
            </div>
          )}
          
          {/* Step 1: Patient Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Patient Information
                </CardTitle>
                <CardDescription>
                  Please provide your basic information to begin the consent process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                 <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consentDate">Date of Consent *</Label>
                    <Input
                      id="consentDate"
                      type="date"
                      value={formData.consentDate}
                      onChange={(e) => handleInputChange('consentDate', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
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
                <div>
                  <Label htmlFor="procedure">Scheduled Procedure *</Label>
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
          )}

          {/* Step 2: Consent & Signature */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Informed Consent
                  </CardTitle>
                  <CardDescription>
                    Please read carefully and acknowledge your understanding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                {/* Consent to Use Photos and Videos */}
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-4">Consent to Use of Dental Photographs and Videos</h3>
                  <div className="space-y-4 text-sm text-green-800">
                    <p>
                      I hereby consent to the taking of dental photographs and/or videos of my face, mouth, and/or teeth, before, during, and after my treatment at this dental practice.
                    </p>
                    <p>
                      I grant the dental practice and its authorized representatives the irrevocable right to use these images and/or videos, with or without my name, for purposes including, but not limited to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                      <li>Treatment planning, analysis, and documentation.</li>
                      <li>Educational purposes for other dental professionals.</li>
                      <li>Marketing and promotional materials for the dental practice (e.g., website, social media, brochures).</li>
                    </ul>
                    <p>
                      I understand that I will not be compensated for the use of these images or videos. I release the dental practice from any and all claims that may arise from such use, including any claims for libel, invasion of privacy, or violation of rights of publicity. This consent is valid indefinitely unless revoked by me in writing.
                    </p>
                  </div>
                </div>

                  {/* Consent Checkboxes */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="consentAcknowledged"
                        checked={formData.consentAcknowledged}
                        onCheckedChange={(checked) => handleInputChange('consentAcknowledged', checked)}
                      />
                      <Label htmlFor="consentAcknowledged" className="text-sm leading-relaxed">
                        I acknowledge that I have read and understood the nature of the proposed treatment, including its purpose and what it involves.
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="risksUnderstood"
                        checked={formData.risksUnderstood}
                        onCheckedChange={(checked) => handleInputChange('risksUnderstood', checked)}
                      />
                      <Label htmlFor="risksUnderstood" className="text-sm leading-relaxed">
                        I have had the opportunity to ask questions, and all my questions have been answered to my satisfaction.
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="questionsAnswered"
                        checked={formData.questionsAnswered}
                        onCheckedChange={(checked) => handleInputChange('questionsAnswered', checked)}
                      />
                      <Label htmlFor="questionsAnswered" className="text-sm leading-relaxed">
                        I consent to have my photos and videos shared with the dental practice and its authorized representatives.
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="financialConsent"
                        checked={formData.financialConsent}
                        onCheckedChange={(checked) => handleInputChange('financialConsent', checked)}
                      />
                      <Label htmlFor="financialConsent" className="text-sm leading-relaxed">
                        I consent to receive photos and videos from the dental practice via text and email.
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Signature Pad */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PenTool className="h-5 w-5 text-purple-600" />
                    Electronic Signature
                  </CardTitle>
                  <CardDescription>
                    Sign below to provide your electronic consent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={200}
                      className="w-full h-32 border rounded cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{ touchAction: 'none' }}
                    />
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-sm text-gray-600">
                        {hasSignature ? '✓ Signature captured' : 'Please sign above'}
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={clearSignature}
                      >
                        Clear Signature
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    By signing above, I consent to the treatment and acknowledge that I have read and understood this consent form.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex gap-2">
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`h-3 w-3 rounded-full ${
                    step === currentStep 
                      ? 'bg-blue-600' 
                      : step < currentStep || isStepComplete(step)
                      ? 'bg-green-600' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              
              {currentStep < 2 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  disabled={!isStepComplete(currentStep)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={!isStepComplete(2) || isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete Consent
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
