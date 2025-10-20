'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Image, 
  Video, 
  Download, 
  Share2, 
  Facebook, 
  Instagram, 
  Mail, 
  MessageCircle,
  ExternalLink,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PatientConsent {
  id: string;
  firstName: string;
  lastName: string;
  procedureType: string;
  consentDate: string;
}

interface MediaFile {
  id: string;
  patientConsentId: string;
  fileName: string;
  fileType: 'image' | 'video';
  mediaCategory: 'before' | 'after';
  fileSize: number;
  uploadDate: string;
  preview: string;
}

interface ShareableLink {
  id: string;
  patientConsentId: string;
  token: string;
  expiresAt: string;
  selectedMedia: string[];
  isActive: boolean;
  createdAt: string;
}

function ShareTokenContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [shareData, setShareData] = useState<{
    link: ShareableLink;
    patient: PatientConsent;
    media: MediaFile[];
  } | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No share token provided');
      setIsLoading(false);
      return;
    }

    try {
      const shareableLinks = JSON.parse(localStorage.getItem('shareableLinks') || '[]');
      const patients = JSON.parse(localStorage.getItem('patientConsents') || '[]');
      const allMedia = JSON.parse(localStorage.getItem('patientMedia') || '[]');

      const link = shareableLinks.find((l: ShareableLink) => l.token === token);
      
      if (!link) {
        setError('Share link not found');
        setIsLoading(false);
        return;
      }

      if (!link.isActive) {
        setError('This share link has been deactivated');
        setIsLoading(false);
        return;
      }

      if (new Date(link.expiresAt) < new Date()) {
        setError('This share link has expired');
        setIsLoading(false);
        return;
      }

      const patient = patients.find((p: PatientConsent) => p.id === link.patientConsentId);
      if (!patient) {
        setError('Patient data not found');
        setIsLoading(false);
        return;
      }

      const selectedMediaFiles = allMedia.filter((m: MediaFile) => 
        link.selectedMedia.includes(m.id)
      );

      setShareData({
        link,
        patient,
        media: selectedMediaFiles
      });
    } catch (error) {
      setError('Failed to load shared content');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shareData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {shareData.patient.firstName}'s Treatment Results
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            {shareData.patient.procedureType} • {format(new Date(shareData.patient.consentDate), 'MMMM yyyy')}
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share2 className="h-5 w-5" />
              <span>Share Your Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <Button variant="outline" className="flex items-center space-x-2 justify-center">
                <Facebook className="h-4 w-4 text-blue-600" />
                <span>Facebook</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2 justify-center">
                <Instagram className="h-4 w-4 text-pink-600" />
                <span>Instagram</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ShareTokenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ShareTokenContent />
    </Suspense>
  );
}