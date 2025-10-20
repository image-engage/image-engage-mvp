'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import CameraWithGuides from '@/components/CameraWithGuides';
import ImageEditor from '@/components/ImageEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Camera, Edit, Save, FileText } from 'lucide-react';
import Link from 'next/link';

interface CapturedImage {
  id: string;
  dataUrl: string;
  metadata: any;
  edited?: boolean;
  annotations?: any[];
}

export default function CapturePage() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  const category = searchParams.get('category') as 'before' | 'after' || 'before';
  
  const [currentStep, setCurrentStep] = useState<'capture' | 'edit' | 'review'>('capture');
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [gridType, setGridType] = useState<'dental-intraoral' | 'dental-extraoral' | 'smile' | 'profile'>('dental-intraoral');

  const handleImageCapture = (imageData: string, metadata: any) => {
    const newImage: CapturedImage = {
      id: Date.now().toString(),
      dataUrl: imageData,
      metadata,
      edited: false
    };
    
    setCapturedImages([...capturedImages, newImage]);
  };

  const handleImageEdit = (editedImageData: string, annotations: any[]) => {
    if (selectedImageIndex === null) return;
    
    const updatedImages = [...capturedImages];
    updatedImages[selectedImageIndex] = {
      ...updatedImages[selectedImageIndex],
      dataUrl: editedImageData,
      annotations,
      edited: true
    };
    
    setCapturedImages(updatedImages);
    setCurrentStep('review');
  };

  const saveSession = async () => {
    try {
      const formData = new FormData();
      formData.append('patientConsentId', patientId || '');
      formData.append('mediaCategory', category);
      
      for (let i = 0; i < capturedImages.length; i++) {
        const image = capturedImages[i];
        const blob = await fetch(image.dataUrl).then(r => r.blob());
        formData.append('files', blob, `${category}_${i + 1}.jpg`);
      }
      
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert('Images saved successfully!');
        window.location.href = '/workflow';
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving images');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/workflow">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Photo Capture</h1>
              <p className="text-gray-600">Patient: {patientId} | {category.toUpperCase()}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Badge variant={currentStep === 'capture' ? 'default' : 'secondary'}>
              <Camera className="h-3 w-3 mr-1" />
              Capture
            </Badge>
            <Badge variant={currentStep === 'edit' ? 'default' : 'secondary'}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Badge>
            <Badge variant={currentStep === 'review' ? 'default' : 'secondary'}>
              <Save className="h-3 w-3 mr-1" />
              Review
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {currentStep === 'capture' && (
              <Card>
                <CardHeader>
                  <CardTitle>Standardized Capture</CardTitle>
                  <div className="flex gap-2">
                    {(['dental-intraoral', 'dental-extraoral', 'smile', 'profile'] as const).map((type) => (
                      <Button
                        key={type}
                        variant={gridType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGridType(type)}
                      >
                        {type.replace('-', ' ').toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <CameraWithGuides
                    onCapture={handleImageCapture}
                    gridType={gridType}
                    category={category}
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 'edit' && selectedImageIndex !== null && (
              <Card>
                <CardHeader>
                  <CardTitle>Image Editor</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageEditor
                    imageUrl={capturedImages[selectedImageIndex].dataUrl}
                    onSave={handleImageEdit}
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 'review' && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {capturedImages.map((image, index) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.dataUrl}
                          alt={`Captured ${index + 1}`}
                          className="w-full h-32 object-cover rounded border"
                        />
                        {image.edited && (
                          <Badge className="absolute top-2 right-2 bg-green-600">
                            Edited
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Button onClick={saveSession} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Session
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Images ({capturedImages.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {capturedImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="flex items-center gap-3 p-2 border rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setCurrentStep('edit');
                    }}
                  >
                    <img
                      src={image.dataUrl}
                      alt={`Thumb ${index + 1}`}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Image {index + 1}</p>
                      <p className="text-xs text-gray-500">
                        {image.edited ? 'Edited' : 'Original'}
                      </p>
                    </div>
                  </div>
                ))}
                
                {capturedImages.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No images captured
                  </p>
                )}
              </CardContent>
            </Card>

            {capturedImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => setCurrentStep('review')}
                    variant="outline"
                    className="w-full"
                  >
                    Review Session
                  </Button>
                  <Button
                    onClick={() => setCurrentStep('capture')}
                    variant="outline"
                    className="w-full"
                  >
                    Capture More
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}