'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Scale, 
  FileText, 
  Shield, 
  CheckCircle2,
  AlertTriangle,
  PenTool,
  Loader2
} from 'lucide-react';

// Assuming this type is defined elsewhere in your project
interface Legal {
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  hipaaSignature: {
    fullName: string;
    title: string;
  };
}

type PageProps = {
  onNext: () => void;
  onBack: () => void;
};

export default function LegalContent({ onNext, onBack }: PageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Legal>({
    defaultValues: {
      termsAccepted: false,
      privacyPolicyAccepted: false,
    }
  });

  const termsAccepted = watch('termsAccepted');
  const privacyAccepted = watch('privacyPolicyAccepted');
  const signatureName = watch('hipaaSignature.fullName');

  const onSubmit = async (data: Legal) => {
    setIsSubmitting(true);
    setSubmissionMessage(null);

    // 1. Get all stored onboarding data from localStorage
    const currentOnboardingData = localStorage.getItem('onboardingData');
    const parsedData = currentOnboardingData ? JSON.parse(currentOnboardingData) : {};
    
    // Add the final legal documents data to the object
    const finalSubmissionData = {
      ...parsedData,
      legal: {
        ...data,
        hipaaSignature: {
          ...data.hipaaSignature,
          signatureDate: new Date().toISOString(),
          digitalSignature: `${data.hipaaSignature.fullName}_${Date.now()}`, // Simple digital signature
        }
      },
      completedAt: new Date().toISOString()
    };

    console.log('Final onboarding data saved to localStorage:', finalSubmissionData);
    
    // 2. Save complete data to localStorage (simulating database save)
    try {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save to localStorage as completed onboarding data
      localStorage.setItem('completedOnboardingData', JSON.stringify(finalSubmissionData));
      localStorage.removeItem('onboardingData'); // Clear temporary data
      
      setSubmissionMessage('Onboarding completed successfully! Data saved to localStorage.');
      
      // Move to completion screen
      setTimeout(() => {
        onNext();
      }, 2000);

    } catch (error) {
      console.error('Submission failed:', error);
      setSubmissionMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = termsAccepted && privacyAccepted && signatureName;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Scale className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Legal Documents & Compliance
        </h2>
        <p className="text-slate-600">
          Please review and accept the required legal documents to complete your setup
        </p>
      </div>

      {submissionMessage && (
        <div className={`p-4 border rounded-lg text-center ${
          submissionMessage.includes('successfully') 
            ? 'bg-green-100 border-green-400 text-green-700' 
            : 'bg-red-100 border-red-400 text-red-700'
        }`}>
          {submissionMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Terms of Service */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                Terms of Service
              </h3>
            </div>

            <ScrollArea className="h-48 w-full border rounded-lg p-4 bg-slate-50">
              <div className="space-y-4 text-sm text-slate-700">
                <h4 className="font-semibold">Image Engage Terms of Service</h4>
                
                <div className="space-y-3">
                  <p>
                    <strong>1. Service Agreement:</strong> By using Image Engage, you agree to our automated 
                    social media posting service for medical practices. We provide content creation, 
                    scheduling, and posting services across connected social media platforms.
                  </p>
                  
                  <p>
                    <strong>2. Content Standards:</strong> All content must comply with medical advertising 
                    regulations, HIPAA requirements, and platform-specific guidelines. You are responsible 
                    for ensuring content accuracy and regulatory compliance.
                  </p>
                  
                  <p>
                    <strong>3. Account Security:</strong> You must maintain the security of your social media 
                    accounts and notify us immediately of any unauthorized access or security breaches.
                  </p>
                  
                  <p>
                    <strong>4. Billing and Cancellation:</strong> Subscriptions are billed monthly in advance. 
                    You may cancel at any time with 30 days notice. Refunds are provided on a pro-rated basis.
                  </p>
                  
                  <p>
                    <strong>5. Limitation of Liability:</strong> Our liability is limited to the amount paid 
                    for services in the preceding 12 months. We are not liable for indirect or consequential damages.
                  </p>
                  
                  <p>
                    <strong>6. Data Protection:</strong> We implement industry-standard security measures to 
                    protect your data and comply with applicable privacy regulations.
                  </p>
                </div>
              </div>
            </ScrollArea>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="termsAccepted"
                checked={termsAccepted}
                onCheckedChange={(checked) => setValue('termsAccepted', !!checked)}
              />
              <Label htmlFor="termsAccepted" className="text-sm font-medium">
                I have read and agree to the Terms of Service *
              </Label>
            </div>
            {errors.termsAccepted && (
              <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Privacy Policy */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                Privacy Policy
              </h3>
            </div>

            <ScrollArea className="h-48 w-full border rounded-lg p-4 bg-slate-50">
              <div className="space-y-4 text-sm text-slate-700">
                <h4 className="font-semibold">Privacy Policy</h4>
                
                <div className="space-y-3">
                  <p>
                    <strong>Information Collection:</strong> We collect practice information, social media 
                    credentials, and billing details necessary to provide our services. We do not collect 
                    patient health information (PHI).
                  </p>
                  
                  <p>
                    <strong>Data Usage:</strong> Your information is used solely to provide social media 
                    services, process payments, and communicate about your account. We never sell or 
                    share your data with third parties for marketing purposes.
                  </p>
                  
                  <p>
                    <strong>Data Security:</strong> We use encryption, secure servers, and regular security 
                    audits to protect your information. Access is limited to authorized personnel only.
                  </p>
                  
                  <p>
                    <strong>Third-Party Integrations:</strong> We securely connect to social media platforms 
                    and payment processors. Each integration follows industry security standards.
                  </p>
                  
                  <p>
                    <strong>Data Retention:</strong> We retain your data for as long as you maintain an 
                    active account plus 30 days. You may request data deletion at any time.
                  </p>
                  
                  <p>
                    <strong>Your Rights:</strong> You have the right to access, modify, or delete your 
                    personal information. Contact our support team for assistance with data requests.
                  </p>
                </div>
              </div>
            </ScrollArea>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="privacyAccepted"
                checked={privacyAccepted}
                onCheckedChange={(checked) => setValue('privacyPolicyAccepted', !!checked)}
              />
              <Label htmlFor="privacyAccepted" className="text-sm font-medium">
                I have read and agree to the Privacy Policy *
              </Label>
            </div>
            {errors.privacyPolicyAccepted && (
              <p className="text-sm text-red-600">{errors.privacyPolicyAccepted.message}</p>
            )}
          </CardContent>
        </Card>

        {/* HIPAA Business Associate Agreement */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="text-lg font-semibold text-orange-900">
                  HIPAA Business Associate Agreement (BAA)
                </h3>
                <p className="text-sm text-orange-800">
                  Required for all healthcare practices handling protected health information
                </p>
              </div>
            </div>

            <ScrollArea className="h-64 w-full border rounded-lg p-4 bg-white">
              <div className="space-y-4 text-sm text-slate-700">
                <h4 className="font-semibold text-slate-900">HIPAA Business Associate Agreement</h4>
                
                <div className="space-y-3">
                  <p>
                    This Business Associate Agreement ("Agreement") is entered into between your medical 
                    practice ("Covered Entity") and Image Engage ("Business Associate") to ensure 
                    compliance with the Health Insurance Portability and Accountability Act (HIPAA).
                  </p>
                  
                  <p>
                    <strong>1. Definitions:</strong> All terms not defined herein shall have the meaning 
                    set forth in the HIPAA Privacy Rule and Security Rule.
                  </p>
                  
                  <p>
                    <strong>2. Permitted Uses and Disclosures:</strong> Business Associate may use or 
                    disclose Protected Health Information (PHI) only as necessary to provide social 
                    media services or as required by law.
                  </p>
                  
                  <p>
                    <strong>3. Safeguards:</strong> Business Associate will use appropriate safeguards 
                    to prevent use or disclosure of PHI other than as provided for in this Agreement, 
                    including implementing administrative, physical, and technical safeguards.
                  </p>
                  
                  <p>
                    <strong>4. Reporting:</strong> Business Associate will report any use or disclosure 
                    of PHI not provided for by this Agreement within 24 hours of discovery.
                  </p>
                  
                  <p>
                    <strong>5. Access and Amendment:</strong> Business Associate will provide access 
                    to PHI and incorporate amendments as directed by Covered Entity.
                  </p>
                  
                  <p>
                    <strong>6. Return or Destruction:</strong> Upon termination of this Agreement, 
                    Business Associate will return or destroy all PHI received from or created on 
                    behalf of Covered Entity.
                  </p>
                  
                  <p>
                    <strong>7. Compliance:</strong> Business Associate will comply with the applicable 
                    provisions of the HIPAA Privacy Rule and Security Rule.
                  </p>
                </div>
              </div>
            </ScrollArea>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 flex items-center">
                <PenTool className="h-4 w-4 mr-2 text-blue-600" />
                Digital Signature
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signerName">Full Name (Digital Signature) *</Label>
                  <Input
                    id="signerName"
                    {...register('hipaaSignature.fullName', { 
                      required: 'Digital signature (full name) is required' 
                    })}
                    className="mt-1"
                    placeholder="Dr. John Smith"
                  />
                  {errors.hipaaSignature?.fullName && (
                    <p className="text-sm text-red-600 mt-1">{errors.hipaaSignature.fullName.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="signerTitle">Title/Position</Label>
                  <Input
                    id="signerTitle"
                    {...register('hipaaSignature.title')}
                    className="mt-1"
                    placeholder="Practice Owner / Medical Director"
                  />
                </div>
              </div>

              {signatureName && (
                <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-lg">
                  <p className="text-sm text-slate-600 mb-2">Digital Signature Preview:</p>
                  <div className="font-signature text-2xl text-blue-600 border-b border-slate-300 pb-2">
                    {signatureName}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    By typing your name above, you are providing your digital signature to this agreement.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completion Status */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">
              Completion Checklist
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                {termsAccepted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                )}
                <span className={termsAccepted ? 'text-green-700' : 'text-slate-600'}>
                  Terms of Service accepted
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                {privacyAccepted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                )}
                <span className={privacyAccepted ? 'text-green-700' : 'text-slate-600'}>
                  Privacy Policy accepted
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                {signatureName ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                )}
                <span className={signatureName ? 'text-green-700' : 'text-slate-600'}>
                  HIPAA BAA digitally signed
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Message */}
        {submissionMessage && (
          <div className={`mt-4 p-4 rounded-lg ${submissionMessage.includes('error') ? 'bg-red-100 border-red-200 text-red-800' : 'bg-green-100 border-green-200 text-green-800'}`}>
            {submissionMessage}
          </div>
        )}

        <div className="flex justify-between">
          <Button type="button" variant="outline" size="lg" onClick={onBack} disabled={isSubmitting}>
            Back to Billing
          </Button>
          <Button 
            type="submit" 
            size="lg" 
            className="bg-green-600 hover:bg-green-700"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
