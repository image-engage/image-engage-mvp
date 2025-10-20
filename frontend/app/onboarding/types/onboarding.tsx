export interface BasicInfo {
  businessName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  logo?: File;
  brandColors: {
    primary: string;
    secondary: string;
  };
  contactInfo: {
    phone: string;
    email: string;
  };
  businessHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
}

export interface SocialMedia {
  websiteUrl: string;
  platforms: {
    instagram: { connected: boolean; username: string; accessToken?: string };
    facebook: { connected: boolean; pageId: string; accessToken?: string };
    tiktok: { connected: boolean; username: string; accessToken?: string };
  };
}

export interface Billing {
  paymentMethod: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
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
  subscriptionPlan: 'basic' | 'professional' | 'enterprise';
}

export interface Legal {
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  hipaaSignature: {
    fullName: string;
    title: string;
    signatureDate: string;
    digitalSignature: string;
  };
}

export interface OnboardingData {
  basicInfo: Partial<BasicInfo>;
  socialMedia: Partial<SocialMedia>;
  billing: Partial<Billing>;
  legal: Partial<Legal>;
  currentStep: number;
  completed: boolean;
}