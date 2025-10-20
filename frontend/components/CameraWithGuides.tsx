'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Grid, RotateCcw } from 'lucide-react';

interface CameraWithGuidesProps {
  onCapture: (imageData: string, metadata: CaptureMetadata) => void;
  gridType: 'dental-intraoral' | 'dental-extraoral' | 'smile' | 'profile';
  category: 'before' | 'after';
}

interface CaptureMetadata {
  timestamp: string;
  gridType: string;
  category: string;
  deviceInfo: {
    userAgent: string;
    screenResolution: string;
  };
}

export default function CameraWithGuides({ onCapture, gridType, category }: CameraWithGuidesProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error('Camera access error:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.85);
      const metadata: CaptureMetadata = {
        timestamp: new Date().toISOString(),
        gridType,
        category,
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`
        }
      };
      
      onCapture(imageData, metadata);
    }
    
    setTimeout(() => setIsCapturing(false), 500);
  };

  const renderGrid = () => {
    const gridStyles = {
      'dental-intraoral': 'grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);',
      'dental-extraoral': 'grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr);',
      'smile': 'grid-template-columns: 1fr; grid-template-rows: 1fr 2fr 1fr;',
      'profile': 'grid-template-columns: 1fr 2fr 1fr; grid-template-rows: 1fr;'
    };

    return (
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{ 
          display: 'grid',
          ...Object.fromEntries([['style', gridStyles[gridType]]])
        }}
      >
        {Array.from({ length: gridType === 'dental-intraoral' ? 9 : gridType === 'dental-extraoral' ? 4 : 3 }).map((_, i) => (
          <div key={i} className="border border-white/30 border-dashed" />
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {renderGrid()}
        
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {gridType.replace('-', ' ').toUpperCase()} | {category.toUpperCase()}
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="flex justify-center mt-4 gap-4">
        <Button
          onClick={captureImage}
          disabled={isCapturing}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Camera className="mr-2 h-5 w-5" />
          {isCapturing ? 'Capturing...' : 'Capture Photo'}
        </Button>
        
        <Button
          onClick={startCamera}
          variant="outline"
          size="lg"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Reset Camera
        </Button>
      </div>
    </div>
  );
}