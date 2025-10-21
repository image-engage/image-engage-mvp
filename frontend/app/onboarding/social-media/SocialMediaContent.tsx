'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Instagram, 
  Facebook, 
  Music, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  Link as LinkIcon 
} from 'lucide-react';

// Assuming this type is defined elsewhere in your project
interface SocialMedia {
  platforms: {
    instagram: { connected: boolean; username: string; };
    facebook: { connected: boolean; pageId: string; };
    tiktok: { connected: boolean; username: string; };
  };
}

type PageProps = {
  onNext: () => void;
  onBack: () => void;
};

export default function SocialMediaPage({ onNext, onBack }: PageProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Load initial data from localStorage with a type assertion
  const storedData = typeof window !== 'undefined' ? localStorage.getItem('onboardingData') : null;
  const initialData = storedData ? JSON.parse(storedData) as { socialMedia?: SocialMedia } : {};
  const initialSocialMediaData = initialData.socialMedia || {
    platforms: {
      instagram: { connected: false, username: '' },
      facebook: { connected: false, pageId: '' },
      tiktok: { connected: false, username: '' },
    }
  };

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SocialMedia>({
    defaultValues: initialSocialMediaData
  });

  const initialConnectedPlatforms = Object.entries(initialSocialMediaData.platforms)
    .filter(([, { connected }]) => connected)
    .map(([key]) => key);

  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>(initialConnectedPlatforms);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleConnect = (platform: string) => {
    // Simulate OAuth connection
    setConnectedPlatforms(prev => [...prev, platform]);
    setValue(`platforms.${platform}.connected` as any, true);
  };

  const handleDisconnect = (platform: string) => {
    setConnectedPlatforms(prev => prev.filter(p => p !== platform));
    setValue(`platforms.${platform}.connected` as any, false);
    // Also clear the username/pageId on disconnect
    if (platform === 'facebook') {
      setValue(`platforms.${platform}.pageId` as any, '');
    } else {
      setValue(`platforms.${platform}.username` as any, '');
    }
  };

  const onSubmit = (data: SocialMedia) => {
    console.log('Social Media:', data);
    
    // Merge social media data with existing data in localStorage
    const currentOnboardingData = localStorage.getItem('onboardingData');
    const parsedData = currentOnboardingData ? JSON.parse(currentOnboardingData) : {};
    const dataToStore = {
      ...parsedData,
      socialMedia: data,
    };
    
    localStorage.setItem('onboardingData', JSON.stringify(dataToStore));
    onNext();
  };

  if (!isMounted) {
    return null;
  }
  
  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      description: 'Share photos and stories of your practice',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600',
      description: 'Connect with patients and share updates',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: Music,
      color: 'bg-black',
      description: 'Create engaging short-form videos',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <LinkIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Connect Your Social Media Accounts
        </h2>
        <p className="text-slate-600">
          We'll use these connections to automatically post your content across all platforms
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Website URL */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-600" />
              Practice Website
            </h3>
            
            <div>
              <Label htmlFor="websiteUrl">Website URL *</Label>
              <Input
                id="websiteUrl"
                {...register('websiteUrl', { 
                  required: 'Website URL is required',
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL starting with http:// or https://'
                  }
                })}
                className="mt-1"
                placeholder="https://www.yourpractice.com"
              />
              {errors.websiteUrl && (
                <p className="text-sm text-red-600 mt-1">{errors.websiteUrl.message}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                This URL will be included in your social media posts to drive traffic
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Platforms */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Social Media Platforms
          </h3>
          
          {platforms.map((platform) => {
            const isConnected = connectedPlatforms.includes(platform.id);
            const Icon = platform.icon;

            return (
              <Card key={platform.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${platform.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 flex items-center space-x-2">
                          <span>{platform.name}</span>
                          {isConnected ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Connected
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-slate-600">{platform.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {isConnected ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleDisconnect(platform.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handleConnect(platform.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Connect Account
                        </Button>
                      )}
                    </div>
                  </div>

                  {isConnected && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {platform.id === 'facebook' ? (
                          <div>
                            <Label>Facebook Page ID</Label>
                            <Input
                              {...register(`platforms.${platform.id}.pageId` as any)}
                              placeholder="Your Facebook Page ID"
                              className="mt-1"
                            />
                          </div>
                        ) : (
                          <div>
                            <Label>Username</Label>
                            <Input
                              {...register(`platforms.${platform.id}.username` as any)}
                              placeholder={`@your${platform.id}handle`}
                              className="mt-1"
                            />
                          </div>
                        )}
                        <div>
                          <Label>Posting Schedule</Label>
                          <select className="mt-1 w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm">
                            <option>Business hours only</option>
                            <option>24/7 automated</option>
                            <option>Custom schedule</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Connection Status */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h4 className="font-semibold text-blue-900 mb-2">Connection Status</h4>
            <div className="space-y-2">
              <p className="text-sm text-blue-800">
                Connected Platforms: {connectedPlatforms.length} of {platforms.length}
              </p>
              {connectedPlatforms.length === 0 && (
                <p className="text-sm text-blue-700">
                  Connect at least one platform to continue with the onboarding process.
                </p>
              )}
              {connectedPlatforms.length > 0 && (
                <p className="text-sm text-blue-700">
                  Great! You can always add more platforms later from your dashboard.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            Back to Basic Info
          </Button>
          <Button 
            type="submit" 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={connectedPlatforms.length === 0}
          >
            Continue to Billing Setup
          </Button>
        </div>
      </form>
    </div>
  );
}
