"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2 } from 'lucide-react';

// This is a mock of the data that would be saved from the QuestionnairePage
const mockQuestionnaireConfig = [
  { id: 1, text: 'What is your primary reason for visiting us today?', type: 'text' },
  { id: 2, text: 'How would you rate your overall experience?', type: 'radio', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
  { id: 3, text: 'Did you find our staff friendly and helpful?', type: 'radio', options: ['Yes', 'No'] },
];

export default function PatientSurveyPage() {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would send the answers to a backend API.
    // For this mockup, we'll just log the answers and show a success message.
    console.log('Survey submitted:', answers);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-lg w-full text-center p-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">Thank you for your feedback!</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Your responses have been recorded.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
      <Card className="max-w-xl w-full">
        <CardHeader>
          <CardTitle>Patient Feedback Survey</CardTitle>
          <p className="text-sm text-muted-foreground">
            Thank you for visiting us! Please take a moment to share your experience.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {mockQuestionnaireConfig.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label>{question.text}</Label>
                {question.type === 'text' && (
                  <Input
                    type="text"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer"
                  />
                )}
                {question.type === 'radio' && question.options && (
                  <RadioGroup
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    value={answers[question.id]}
                  >
                    <div className="flex flex-wrap gap-4 pt-2">
                      {question.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q${question.id}-o${index}`} />
                          <Label htmlFor={`q${question.id}-o${index}`}>{option}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </div>
            ))}
            <Button type="submit" className="w-full">
              Submit Survey
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
