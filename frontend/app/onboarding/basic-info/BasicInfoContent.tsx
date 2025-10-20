'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Building2, Mail, Phone, Palette, XCircle } from 'lucide-react';
import { BasicInfo } from '../types/onboarding';

type PageProps = {
  onNext: () => void;
};

export default function BasicInfoContent({ onNext }: PageProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load initial data from localStorage if it exists
  const storedData = typeof window !== 'undefined' ? localStorage.getItem('onboardingData') : null;
  const defaultValues = storedData ? JSON.parse(storedData) : {
    brandColors: { primary: '#0369a1', secondary: '#0d9488' },
    // Removed businessHours from defaultValues
  };

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BasicInfo>({
    defaultValues
  });

  useEffect(() => {
    setIsMounted(true);
    // Set logo preview on component mount if stored data has a logo
    if (storedData) {
      const data = JSON.parse(storedData);
      if (data.logo) {
        setLogoPreview(data.logo);
      }
    }
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Set the file object in the form state
      setValue('logo', file);
      // Read the file to set the preview image
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoRemove = () => {
    setLogoPreview(null);
    setValue('logo', undefined);
    const logoInput = document.getElementById('logo') as HTMLInputElement;
    if (logoInput) {
      logoInput.value = '';
    }
  };

  const onSubmit = (data: BasicInfo) => {
    console.log('Basic Info:', data);
    
    // Create a temporary object to store in localStorage.
    // We save the logo preview string, not the File object.
    const dataToStore = {
      ...data,
      logo: logoPreview,
    };

    localStorage.setItem('onboardingData', JSON.stringify(dataToStore));
    setIsSubmitted(true);
    
    // Simulate a slight delay before moving to the next page.
    setTimeout(() => {
      onNext();
    }, 1500);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Tell us about your practice
        </h2>
        <p className="text-slate-600">
          We will use this information to personalize your experience and create your brand presence
        </p>
      </div>
      
      {isSubmitted && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center">
          Information saved successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Business Information */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-blue-600" />
              Business Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Practice Name *</Label>
                <Input
                  id="businessName"
                  {...register('businessName', { required: 'Practice name is required' })}
                  className="mt-1"
                  placeholder="Downtown Medical Associates"
                />
                {errors.businessName && (
                  <p className="text-sm text-red-600 mt-1">{errors.businessName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    {...register('address.street', { required: 'Street address is required' })}
                    className="mt-1"
                    placeholder="123 Healthcare Blvd"
                  />
                  {errors.address?.street && (
                    <p className="text-sm text-red-600 mt-1">{errors.address.street.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...register('address.city', { required: 'City is required' })}
                    className="mt-1"
                    placeholder="Medical City"
                  />
                  {errors.address?.city && (
                    <p className="text-sm text-red-600 mt-1">{errors.address.city.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    {...register('address.state', { required: 'State is required' })}
                    className="mt-1"
                    placeholder="TX"
                  />
                  {errors.address?.state && (
                    <p className="text-sm text-red-600 mt-1">{errors.address.state.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    {...register('address.zipCode', { 
                      required: 'ZIP code is required',
                      pattern: {
                        value: /^\d{5}(?:-\d{4})?$/, // US ZIP code validation
                        message: 'Please enter a valid US ZIP code (e.g., 12345 or 12345-6789)'
                      }
                    })}
                    className="mt-1"
                    placeholder="75001"
                  />
                  {errors.address?.zipCode && (
                    <p className="text-sm text-red-600 mt-1">{errors.address.zipCode.message}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo & Branding */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Palette className="h-5 w-5 mr-2 text-blue-600" />
              Logo & Branding
            </h3>

            <div className="space-y-6">
              <div>
                <Label htmlFor="logo">Practice Logo</Label>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="flex-shrink-0 relative">
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={handleLogoRemove}
                          className="absolute -top-2 -right-2 bg-slate-50 rounded-full shadow-lg p-1 text-slate-500 hover:text-red-500 transition-colors"
                          aria-label="Remove logo"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Upload className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Upload your practice logo (PNG, JPG, or SVG)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Brand Color</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      type="color"
                      {...register('brandColors.primary')}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      {...register('brandColors.primary')}
                      placeholder="#0369a1"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Brand Color</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      type="color"
                      {...register('brandColors.secondary')}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      {...register('brandColors.secondary')}
                      placeholder="#0d9488"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-blue-600" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Main Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('contactInfo.phone', { 
                    required: 'Phone number is required',
                    pattern: {
                      value: /^(\+\d{1,2}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/,
                      message: 'Please enter a valid phone number (e.g., (555) 123-4567)'
                    }
                  })}
                  className="mt-1"
                  placeholder="(555) 123-4567"
                />
                {errors.contactInfo?.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.contactInfo.phone.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Primary Contact Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('contactInfo.email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  className="mt-1"
                  placeholder="contact@practice.com"
                />
                {errors.contactInfo?.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.contactInfo.email.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Removed Business Hours card */}

        <div className="flex justify-end">
          <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700">
            Continue to Legal Documents
          </Button>
        </div>
      </form>
    </div>
  );
}