'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import OnboardingContainer from './OnboardingContainer';
import BasicInfoContent from './basic-info/BasicInfoContent';
import SocialMediaContent from './social-media/SocialMediaContent';
import BillingContent from './billing/BillingContent';
import LegalContent from './legal/LegalContent';

export default function OnboardingPage() {
  const router = useRouter();
  // State to track the current step of the onboarding process
  const [currentStep, setCurrentStep] = useState(1);
  // State to track which steps have been completed for the progress bar
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Function to move to the next step
  const handleNextStep = () => {
    // Add the current step to the list of completed steps
    setCompletedSteps(prev => [...prev, currentStep]);
    // Increment the current step
    setCurrentStep(prev => prev + 1);
  };

  // Function to move to the previous step, correctly handling the back event
  const handlePrevStep = () => {
    // Decrement the current step
    setCurrentStep(prev => prev - 1);
  };

  return (
    <OnboardingContainer currentStep={currentStep} completedSteps={completedSteps}>
      {/* Conditionally render the correct component based on the currentStep state */}
      {currentStep === 1 && <BasicInfoContent onNext={handleNextStep} />}
      {currentStep === 2 && <LegalContent onNext={handleNextStep} onBack={handlePrevStep} />}
      {currentStep > 2 && (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold">Onboarding Complete!</h2>
          <p className="text-slate-600 mt-2">You can now access your dashboard.</p>
          <Button 
            onClick={() => router.push('/dashboard')} 
            className="mt-4"
          >
            Click here to go to dashboard
          </Button>
        </div>
      )}
    </OnboardingContainer>
  );
}
