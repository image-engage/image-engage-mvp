// Workflow for Subscription Handling
// Here's a step-by-step workflow of how these components interact:

// User Enters Payment Info: A user fills out a payment form on the frontend.

// Frontend Tokenizes: The frontend's payment processor SDK (e.g., Stripe.js) takes the card details and sends them directly to the payment processor. The processor returns a single-use token to the frontend.

// Frontend Sends Token to Backend: The frontend sends this token, along with the user's userId and selected plan, to your backend's POST /api/subscriptions endpoint.

// Backend Creates Subscription: Your TypeScript backend receives the token. It then calls the payment processor's API (using a secret API key) to perform two key actions:

// Create a Customer: It creates a new customer object, linking the payment token to it. The processor returns a customerId.

// Create a Subscription: It then uses the customerId to create a new recurring subscription for the specified plan. The processor returns a subscriptionId.

// Backend Stores IDs: Your backend service securely stores the userId, customerId, and subscriptionId in your subscriptions database table. It does not store any sensitive payment data.

// Payment Processor Manages Billing: The payment processor now takes over. On the billing date each month, it automatically attempts to charge the saved payment method.

// Webhook Communication: The payment processor sends webhooks (HTTP callbacks) to your backend's designated webhook endpoint to notify you of key events:

// invoice.payment_succeeded: Payment was successful. Your backend can update the subscription.status to "active" if it's not already.

// invoice.payment_failed: Payment failed (e.g., insufficient funds, expired card). Your backend should update the subscription.status to "past_due" and can initiate an email or in-app notification to the user to update their payment method.

// customer.subscription.deleted: A subscription was cancelled. Your backend should update the subscription.status to "cancelled".




'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Check, 
  Shield, 
  Star,
  Building,
  Users,
  Zap,
  Loader2
} from 'lucide-react';

// Assuming this type is defined elsewhere in your project
interface Billing {
  subscriptionPlan: 'basic' | 'professional' | 'enterprise';
  paymentMethod: {
    cardholderName: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  billingContact: {
    name: string;
    email: string;
  };
}

type PageProps = {
  onNext: () => void;
  onBack: () => void;
};

export default function BillingContent({ onNext, onBack }: PageProps) {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'professional' | 'enterprise'>('professional');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Billing>({
    defaultValues: {
      subscriptionPlan: 'professional'
    }
  });

  const onSubmit = async (data: Billing) => {
    setIsProcessing(true);
    setPaymentStatusMessage(null);

    // --- Start of Simulated Payment Processing ---

    // 1. Frontend Tokenizes: Simulate receiving a single-use token from a payment processor SDK
    const paymentToken = `tok_${Math.random().toString(36).substring(2, 15)}`;

    // 2. Frontend Sends Token to Backend: Simulate sending the token and plan to a backend
    // This is where a real app would make a fetch call to a backend API
    console.log('Simulating API call to backend with token:', paymentToken);

    // 3. Backend Creates Customer & Subscription: Simulate backend logic
    // We'll use a setTimeout to mock network latency.
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock IDs as if a real payment processor returned them
    const customerId = `cus_${Math.random().toString(36).substring(2, 15)}`;
    const subscriptionId = `sub_${Math.random().toString(36).substring(2, 15)}`;

    // 4. Backend Stores IDs: Simulate storing relevant details in a database
    // We'll use localStorage to mock this database persistence
    const subscriptionData = {
      userId: 'mock_user_123', // In a real app, this would come from a user session
      customerId,
      subscriptionId,
      subscriptionPlan: data.subscriptionPlan,
      status: 'active', // Simulating the 'invoice.payment_succeeded' webhook
      timestamp: new Date().toISOString(),
    };

    console.log('Simulated backend storing subscription data:', subscriptionData);
    
    // Merge the new subscription data with existing onboarding data in localStorage
    const currentOnboardingData = localStorage.getItem('onboardingData');
    const parsedData = currentOnboardingData ? JSON.parse(currentOnboardingData) : {};
    const dataToStore = {
      ...parsedData,
      subscription: subscriptionData,
    };
    localStorage.setItem('onboardingData', JSON.stringify(dataToStore));

    // --- End of Simulated Payment Processing ---

    setIsProcessing(false);
    setPaymentStatusMessage('Success! Your payment has been processed and your subscription is active.');

    // In a real app, you would navigate to the next page after a successful payment
    // and potentially based on a response from your backend.
    onNext();
  };

  const plans = [
    {
      id: 'basic' as const,
      name: 'Basic',
      price: 99,
      icon: Building,
      description: 'Perfect for small practices',
      features: [
        '10 posts per month',
        '2 social platforms',
        'Basic templates',
        'Email support',
      ],
      popular: false,
    },
    {
      id: 'professional' as const,
      name: 'Professional',
      price: 199,
      icon: Users,
      description: 'Most popular for growing practices',
      features: [
        '50 posts per month',
        'All social platforms',
        'Premium templates',
        'Patient testimonial tools',
        'Priority support',
        'Analytics dashboard',
      ],
      popular: true,
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      price: 399,
      icon: Zap,
      description: 'For large medical groups',
      features: [
        'Unlimited posts',
        'All social platforms',
        'Custom templates',
        'Advanced analytics',
        'White-label options',
        'Dedicated account manager',
        'API access',
      ],
      popular: false,
    },
  ];

  const handlePlanSelect = (planId: 'basic' | 'professional' | 'enterprise') => {
    setSelectedPlan(planId);
    setValue('subscriptionPlan', planId);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <CreditCard className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Choose Your Plan
        </h2>
        <p className="text-slate-600">
          Select the plan that best fits your practice's needs
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Plan Selection */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Subscription Plans
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.id;

              return (
                <Card 
                  key={plan.id}
                  className={`relative cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
                      : 'hover:border-slate-300 hover:shadow-md'
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <Icon className={`h-8 w-8 mx-auto mb-3 ${
                        isSelected ? 'text-blue-600' : 'text-slate-400'
                      }`} />
                      <h4 className="text-xl font-semibold text-slate-900 mb-1">
                        {plan.name}
                      </h4>
                      <p className="text-sm text-slate-600 mb-3">
                        {plan.description}
                      </p>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-slate-900">
                          ${plan.price}
                        </span>
                        <span className="text-slate-600">/month</span>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isSelected && (
                      <div className="text-center">
                        <Badge variant="default" className="bg-blue-600">
                          Selected Plan
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment Information */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
              Payment Information
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="cardholderName">Cardholder Name *</Label>
                <Input
                  id="cardholderName"
                  {...register('paymentMethod.cardholderName', { required: 'Cardholder name is required' })}
                  className="mt-1"
                  placeholder="Dr. John Smith"
                />
                {errors.paymentMethod?.cardholderName && (
                  <p className="text-sm text-red-600 mt-1">{errors.paymentMethod.cardholderName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cardNumber">Card Number *</Label>
                <Input
                  id="cardNumber"
                  {...register('paymentMethod.cardNumber', { required: 'Card number is required' })}
                  className="mt-1"
                  placeholder="1234 5678 9012 3456"
                />
                {errors.paymentMethod?.cardNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.paymentMethod.cardNumber.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    {...register('paymentMethod.expiryDate', { required: 'Expiry date is required' })}
                    className="mt-1"
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    {...register('paymentMethod.cvv', { required: 'CVV is required' })}
                    className="mt-1"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Billing Address
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="billingStreet">Street Address *</Label>
                <Input
                  id="billingStreet"
                  {...register('billingAddress.street', { required: 'Billing address is required' })}
                  className="mt-1"
                  placeholder="123 Medical Plaza"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="billingCity">City *</Label>
                  <Input
                    id="billingCity"
                    {...register('billingAddress.city', { required: 'City is required' })}
                    className="mt-1"
                    placeholder="Houston"
                  />
                </div>
                <div>
                  <Label htmlFor="billingState">State *</Label>
                  <Input
                    id="billingState"
                    {...register('billingAddress.state', { required: 'State is required' })}
                    className="mt-1"
                    placeholder="TX"
                  />
                </div>
                <div>
                  <Label htmlFor="billingZipCode">ZIP Code *</Label>
                  <Input
                    id="billingZipCode"
                    {...register('billingAddress.zipCode', { required: 'ZIP code is required' })}
                    className="mt-1"
                    placeholder="77001"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Contact */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Billing Contact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billingContactName">Full Name *</Label>
                <Input
                  id="billingContactName"
                  {...register('billingContact.name', { required: 'Billing contact name is required' })}
                  className="mt-1"
                  placeholder="Dr. John Smith"
                />
              </div>
              <div>
                <Label htmlFor="billingContactEmail">Email Address *</Label>
                <Input
                  id="billingContactEmail"
                  type="email"
                  {...register('billingContact.email', { required: 'Billing contact email is required' })}
                  className="mt-1"
                  placeholder="billing@practice.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-2">
                  Secure Payment Processing
                </h4>
                <p className="text-sm text-green-800">
                  Your payment information is processed securely through Stripe. 
                  We never store your credit card details on our servers. 
                  You can cancel or modify your subscription at any time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Message */}
        {paymentStatusMessage && (
          <div className="mt-4 p-4 rounded-lg bg-green-100 border border-green-200 text-green-800">
            {paymentStatusMessage}
          </div>
        )}

        <div className="flex justify-between">
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            Back to Social Media
          </Button>
          <Button 
            type="submit" 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue to Legal Documents'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
