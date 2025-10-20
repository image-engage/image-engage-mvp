'use client';

import { Card } from '@/components/ui/card';

interface OnboardingContainerProps {
  children: React.ReactNode;
  currentStep: number;
  completedSteps: number[];
}

const steps = [
  { id: 1, title: 'Basic Information', description: 'Practice details & branding' },
  { id: 2, title: 'Legal Compliance', description: 'Terms & HIPAA agreement' },
];

export default function OnboardingContainer({ children, currentStep, completedSteps }: OnboardingContainerProps) {
  const progress = (completedSteps.length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ... all your existing UI code ... */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome to Image Engage
            </h1>
            <p className="text-slate-600">
              Let's get your practice set up for social media success
            </p>
          </div>
          {/* ... other parts of your UI ... */}
          <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            {children}
          </Card>
        </div>
      </div>
    </div>
  );
}