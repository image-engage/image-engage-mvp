'use client';

import { useState, useEffect } from 'react';
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

export default function SharedShowcasePage() {
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
    if (token) {
      loadSharedData();
    } else {
      setError('No share token provided');
      setIsLoading(false);
    }
  }, [token]);

  const loadSharedData = () => {
    try {
      // Load data from localStorage (in production, this would be an API call)
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
  };

  const shareOnSocialMedia = (platform: string) => {
    if (!shareData) return;

    const shareText = `Check out my amazing ${shareData.patient.procedureType} results!`;
    const shareUrl = window.location.href;

    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we'll copy to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast.success('Link copied! You can now paste it in your Instagram story or post.');
        return;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(`My ${shareData.patient.procedureType} Results`)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

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

  const beforeMedia = shareData.media.filter(m => m.mediaCategory === 'before');
  const afterMedia = shareData.media.filter(m => m.mediaCategory === 'after');

  const MediaGrid = ({ media, category }: { media: MediaFile[], category: string }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {media.map((file) => (
        <Card 
          key={file.id} 
          className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => setSelectedMedia(file)}
        >
          <div className="aspect-square bg-gray-100 relative">
            {file.fileType === 'image' ? (
              <img
                src={file.preview}
                alt={file.fileName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <Video className="h-8 w-8 text-white" />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white bg-opacity-20 rounded-full p-2">
                    <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                  </div>
                </div>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs">
                {file.fileType}
              </Badge>
            </div>
          </div>
          <CardContent className="p-3">
            <p className="text-sm font-medium truncate">{file.fileName}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                {(file.fileSize / 1024 / 1024).toFixed(1)} MB
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(file.uploadDate), 'MMM d')}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {shareData.patient.firstName}'s Treatment Results
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            {shareData.patient.procedureType} • {format(new Date(shareData.patient.consentDate), 'MMMM yyyy')}
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Expires: {format(new Date(shareData.link.expiresAt), 'PPP')}</span>
            </span>
            <span>{shareData.media.length} photos & videos</span>
          </div>
        </div>

        {/* Social Sharing */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share2 className="h-5 w-5" />
              <span>Share Your Results</span>
            </CardTitle>
            <CardDescription>
              Share your amazing transformation with friends and family
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <Button
                variant="outline"
                className="flex items-center space-x-2 justify-center"
                onClick={() => shareOnSocialMedia('facebook')}
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                <span>Facebook</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2 justify-center"
                onClick={() => shareOnSocialMedia('twitter')}
              >
                <MessageCircle className="h-4 w-4 text-blue-400" />
                <span>Twitter</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2 justify-center"
                onClick={() => shareOnSocialMedia('instagram')}
              >
                <Instagram className="h-4 w-4 text-pink-600" />
                <span>Instagram</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2 justify-center"
                onClick={() => shareOnSocialMedia('whatsapp')}
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span>WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2 justify-center"
                onClick={() => shareOnSocialMedia('email')}
              >
                <Mail className="h-4 w-4 text-gray-600" />
                <span>Email</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2 justify-center"
                onClick={copyLink}
              >
                <ExternalLink className="h-4 w-4 text-gray-600" />
                <span>Copy Link</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Media Showcase */}
        <Tabs defaultValue="comparison" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="before" className="flex items-center space-x-2">
              <span>Before</span>
              <Badge variant="secondary">{beforeMedia.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="after" className="flex items-center space-x-2">
              <span>After</span>
              <Badge variant="secondary">{afterMedia.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="before" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Before Treatment</CardTitle>
                <CardDescription>Starting point of the transformation journey</CardDescription>
              </CardHeader>
              <CardContent>
                {beforeMedia.length > 0 ? (
                  <MediaGrid media={beforeMedia} category="before" />
                ) : (
                  <div className="text-center py-12">
                    <Image className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No before photos shared</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="after" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>After Treatment</CardTitle>
                <CardDescription>The amazing results achieved</CardDescription>
              </CardHeader>
              <CardContent>
                {afterMedia.length > 0 ? (
                  <MediaGrid media={afterMedia} category="after" />
                ) : (
                  <div className="text-center py-12">
                    <Image className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No after photos shared</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Before & After Transformation</CardTitle>
                <CardDescription>See the incredible difference side by side</CardDescription>
              </CardHeader>
              <CardContent>
                {beforeMedia.length > 0 && afterMedia.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-semibold mb-4 text-center">Before Treatment</h4>
                      <MediaGrid media={beforeMedia} category="before" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-4 text-center">After Treatment</h4>
                      <MediaGrid media={afterMedia} category="after" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Both before and after photos are needed for comparison</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            This link expires on {format(new Date(shareData.link.expiresAt), 'PPP')}
          </p>
        </div>
      </div>

      {/* Media Preview Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedMedia.fileName}</h3>
                <p className="text-sm text-gray-600">
                  {selectedMedia.mediaCategory} • {format(new Date(selectedMedia.uploadDate), 'PPP')}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedMedia(null)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="p-4">
              {selectedMedia.fileType === 'image' ? (
                <img
                  src={selectedMedia.preview}
                  alt={selectedMedia.fileName}
                  className="max-w-full max-h-[60vh] object-contain mx-auto"
                />
              ) : (
                <video
                  src={selectedMedia.preview}
                  controls
                  className="max-w-full max-h-[60vh] mx-auto"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}