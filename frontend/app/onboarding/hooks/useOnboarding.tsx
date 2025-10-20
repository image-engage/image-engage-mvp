'use client';

import { useState, useCallback } from 'react';
import { OnboardingData } from '../types/onboarding';

const initialData: OnboardingData = {
  basicInfo: {
    brandColors: { primary: '#0369a1', secondary: '#0d9488' },
    businessHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '13:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true },
    },
  },
  socialMedia: {
    platforms: {
      instagram: { connected: false, username: '' },
      facebook: { connected: false, pageId: '' },
      tiktok: { connected: false, username: '' },
    },
  },
  billing: {},
  legal: {
    termsAccepted: false,
    privacyPolicyAccepted: false,
  },
  currentStep: 1,
  completed: false,
};

export function useOnboarding() {
  const [data, setData] = useState<OnboardingData>(initialData);

const updateStep = useCallback((step: number, stepData: any) => {
  setData(prev => ({
    ...prev,
    [getStepKey(step)]: { ...((prev[getStepKey(step)] as any) || {}), ...stepData },
  }));
}, []);

  const nextStep = useCallback(() => {
    setData(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 4),
    }));
  }, []);

  const previousStep = useCallback(() => {
    setData(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setData(prev => ({ ...prev, currentStep: step }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setData(prev => ({ ...prev, completed: true }));
  }, []);

  return {
    data,
    updateStep,
    nextStep,
    previousStep,
    goToStep,
    completeOnboarding,
  };
}

function getStepKey(step: number): keyof OnboardingData {
  switch (step) {
    case 1: return 'basicInfo';
    case 2: return 'socialMedia';
    case 3: return 'billing';
    case 4: return 'legal';
    default: return 'basicInfo';
  }
}