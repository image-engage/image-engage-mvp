'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Legal } from '../types/onboarding';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type PageProps = {
  onBack: () => void;
};

export default function LegalContent({ onBack }: PageProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // Define a validation schema that only includes the fields present in the form.
  const legalSchema = z.object({
    termsAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the terms." }) }),
    privacyPolicyAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the privacy policy." }) }),
  });

  const { control, handleSubmit, formState: { isValid } } = useForm<Legal>({
    mode: 'onChange',
    resolver: zodResolver(legalSchema), // Use the Zod resolver
    defaultValues: {
      termsAccepted: false,
      privacyPolicyAccepted: false,
    },
  });

  const onSubmit = async (data: Legal) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Gather all data from localStorage
      const storedData = localStorage.getItem('onboardingData');
      if (!storedData) {
        throw new Error('Onboarding data not found. Please start over.');
      }
      const onboardingData = JSON.parse(storedData);

      // Get auth token directly from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Add legal acceptance to the data
      const finalData = {
        ...onboardingData,
        legal: data,
      };

      // 2. Call the new backend endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/practice/complete-onboarding`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(finalData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message2 || 'Failed to complete setup.');
      }

      // 3. On success, clear localStorage and redirect to dashboard
      localStorage.removeItem('onboardingData');
      router.push('/dashboard');

    } catch (error: any) {
      setErrorMessage(error.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Lock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Legal & Compliance
        </h2>
        <p className="text-slate-600">
          Please review and accept our terms to finalize your account setup.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Agreements
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Controller
                  control={control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <Checkbox
                      id="termsAccepted"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="termsAccepted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I agree to the <a href="/terms" target="_blank" className="text-blue-600 hover:underline">Terms of Service</a>.
                  </label>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Controller
                  control={control}
                  name="privacyPolicyAccepted"
                  render={({ field }) => (
                    <Checkbox id="privacyPolicyAccepted" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="privacyPolicyAccepted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I have read and agree to the <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</a>.
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {errorMessage && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-between">
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            Back to Billing
          </Button>
          <Button
            type="submit"
            size="lg"
            className="bg-green-600 hover:bg-green-700"
            disabled={isProcessing || !isValid}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finalizing...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Complete Setup
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}