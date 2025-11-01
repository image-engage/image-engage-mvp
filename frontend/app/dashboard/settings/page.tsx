'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building,
  Users,
  Link as LinkIcon,
  Star,
  Loader2,
  Save,
  AlertCircle,
  Trash2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/components/lib/api';

// --- Type Definitions ---

interface PracticeProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url?: string;
  brand_color?: string;
}

interface ReviewPlatform {
  name: string;
  url: string;
  enabled: boolean;
}

interface ReviewSettings {
  id: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailTemplate: string;
  smsTemplate: string;
  reviewPlatforms: ReviewPlatform[];
  delayHours: number;
}

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'staff';
}

// --- Main Component ---

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for each settings tab
  const [profile, setProfile] = useState<Partial<PracticeProfile>>({});
  const [reviewSettings, setReviewSettings] = useState<Partial<ReviewSettings>>({
    reviewPlatforms: [],
    delayHours: 24,
    emailEnabled: true,
    smsEnabled: false,
  });
  const [users, setUsers] = useState<User[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found.');

      // Fetch all settings data in parallel
      const [profileRes, reviewRes, usersRes] = await Promise.all([
        api.get('/settings/practice-profile', token),
        api.get('/settings/review-settings', token),
        api.get('/settings/users', token),
      ]);

      if (profileRes?.success && profileRes.data) setProfile(profileRes.data);
      if (reviewRes?.success && reviewRes.data) setReviewSettings(reviewRes.data);
      if (usersRes?.success && usersRes.data) setUsers(usersRes.data);

    } catch (err) {
      console.error('Failed to fetch settings:', err);
      const errorMessage = err instanceof ApiError ? err.message : 'An unknown error occurred.';
      setError(`Failed to load settings. ${errorMessage}`);
      toast.error(`Failed to load settings. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProfileChange = (field: keyof PracticeProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleReviewSettingsChange = (field: keyof ReviewSettings, value: any) => {
    setReviewSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePlatformChange = (index: number, field: keyof ReviewPlatform, value: any) => {
    const updatedPlatforms = [...(reviewSettings.reviewPlatforms || [])];
    updatedPlatforms[index] = { ...updatedPlatforms[index], [field]: value };
    setReviewSettings(prev => ({ ...prev, reviewPlatforms: updatedPlatforms }));
  };

  const addPlatform = () => {
    const newPlatform: ReviewPlatform = { name: 'New Platform', url: '', enabled: true };
    setReviewSettings(prev => ({
      ...prev,
      reviewPlatforms: [...(prev.reviewPlatforms || []), newPlatform],
    }));
  };

  const removePlatform = (index: number) => {
    setReviewSettings(prev => ({
      ...prev,
      reviewPlatforms: (prev.reviewPlatforms || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (section: 'profile' | 'reviews') => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found.');

      let response;
      if (section === 'profile') {
        response = await api.put('/settings/practice-profile', profile, token);
      } else if (section === 'reviews') {
        response = await api.put('/settings/review-settings', reviewSettings, token);
      }

      if (response?.success) {
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
      } else {
        throw new Error(response?.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error(`Failed to save ${section} settings:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`Save failed: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">Loading Settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold text-red-700">Error Loading Settings</h2>
        <p className="mt-2 text-gray-600">{error}</p>
        <Button onClick={fetchData} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-600 mt-2">Manage your practice profile, integrations, and automation settings.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="profile"><Building className="h-4 w-4 mr-2" />Profile</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Users</TabsTrigger>
          <TabsTrigger value="integrations"><LinkIcon className="h-4 w-4 mr-2" />Integrations</TabsTrigger>
          <TabsTrigger value="reviews"><Star className="h-4 w-4 mr-2" />Reviews</TabsTrigger>
        </TabsList>

        {/* Practice Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Practice Profile</CardTitle>
              <CardDescription>Update your practice's public information and branding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Practice Name</Label>
                  <Input id="name" value={profile.name || ''} onChange={(e) => handleProfileChange('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={profile.phone || ''} onChange={(e) => handleProfileChange('phone', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={profile.address || ''} onChange={(e) => handleProfileChange('address', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Public Email</Label>
                  <Input id="email" type="email" value={profile.email || ''} onChange={(e) => handleProfileChange('email', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input id="website" value={profile.website || ''} onChange={(e) => handleProfileChange('website', e.target.value)} />
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end p-6 border-t">
              <Button onClick={() => handleSave('profile')} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Profile
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Invite and manage team members' access.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Team Members ({users.length})</h3>
                    <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Invite User</Button>
                </div>
                <div className="border rounded-lg">
                    {users.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                            <div>
                                <p className="font-medium">{user.first_name} {user.last_name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <span className="text-sm capitalize text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{user.role}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect with third-party services like Google Drive.</CardDescription>
            </CardHeader>
            <CardContent>
              <Card className="bg-gray-50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src="/google-drive-logo.png" alt="Google Drive" className="h-10 w-10" />
                    <div>
                      <CardTitle className="text-lg">Google Drive</CardTitle>
                      <CardDescription>Securely store and manage patient media.</CardDescription>
                    </div>
                  </div>
                  <Button disabled>Connected</Button>
                </CardHeader>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Automation Tab */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Review Request Automation</CardTitle>
              <CardDescription>Configure how and when to ask patients for reviews after their sessions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* General Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">General Settings</h3>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="emailEnabled" className="font-medium">Enable Email Requests</Label>
                  <Switch id="emailEnabled" checked={reviewSettings.emailEnabled} onCheckedChange={(c) => handleReviewSettingsChange('emailEnabled', c)} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="smsEnabled" className="font-medium">Enable SMS Requests</Label>
                  <Switch id="smsEnabled" checked={reviewSettings.smsEnabled} onCheckedChange={(c) => handleReviewSettingsChange('smsEnabled', c)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delayHours">Send Delay (in hours)</Label>
                  <Input id="delayHours" type="number" value={reviewSettings.delayHours || 24} onChange={(e) => handleReviewSettingsChange('delayHours', parseInt(e.target.value, 10))} />
                  <p className="text-xs text-gray-500">Time to wait after a session is completed before sending a review request.</p>
                </div>
              </div>

              {/* Templates */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Message Templates</h3>
                <div className="space-y-2">
                  <Label htmlFor="emailTemplate">Email Template</Label>
                  <Textarea id="emailTemplate" rows={5} value={reviewSettings.emailTemplate || ''} onChange={(e) => handleReviewSettingsChange('emailTemplate', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smsTemplate">SMS Template</Label>
                  <Textarea id="smsTemplate" rows={3} value={reviewSettings.smsTemplate || ''} onChange={(e) => handleReviewSettingsChange('smsTemplate', e.target.value)} />
                </div>
                <p className="text-xs text-gray-500">
                  {`Use placeholders: \`{{patientName}}\`, \`{{procedureType}}\`, \`{{reviewUrl}}\``}
                </p>
              </div>

              {/* Review Platforms */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Review Platforms</h3>
                  <Button variant="outline" size="sm" onClick={addPlatform}><Plus className="h-4 w-4 mr-2" />Add Platform</Button>
                </div>
                <div className="space-y-3">
                  {(reviewSettings.reviewPlatforms || []).map((platform, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg items-end">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`platform-url-${index}`}>Platform URL (e.g., Google, Yelp)</Label>
                        <Input id={`platform-url-${index}`} value={platform.url} onChange={(e) => handlePlatformChange(index, 'url', e.target.value)} placeholder="https://g.page/r/YourID/review" />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch id={`platform-enabled-${index}`} checked={platform.enabled} onCheckedChange={(c) => handlePlatformChange(index, 'enabled', c)} />
                          <Label htmlFor={`platform-enabled-${index}`}>Enabled</Label>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removePlatform(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end p-6 border-t">
              <Button onClick={() => handleSave('reviews')} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Review Settings
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}