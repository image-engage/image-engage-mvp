'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, ArrowLeft, CheckCircle2, Loader2, UploadCloud, XCircle, Plus, Video, Pause, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { api, ApiResponse } from '@/components/lib/api';
import { Progress } from '@/components/ui/progress-custom';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner'; // Assuming sonner is available for toasts

// --- Interface Definitions ---
interface CapturedPhoto {
  id: string;
  preview: string;
  category: 'before' | 'after';
  type: string;
}

interface StagedMedia {
  file: File;
  previewUrl: string;
  type: string;
  category: 'before' | 'after';
}

interface StagedVideo {
  file: File;
  previewUrl: string;
  category: 'before' | 'after';
}

type WorkflowStep = 'before' | 'after';

interface PatientSession {
  sessionId: string;
  patientId: string;
  patientName: string;
  procedure: string;
  currentStep: WorkflowStep;
  beforePhotos: CapturedPhoto[];
  afterPhotos: CapturedPhoto[];
  videos: any[];
  createdAt: string;
}

interface Practice {
  id: string;
  name: string;
  isonboarded: boolean;
  google_drive_folder_id: string | null;
}

// --- Constants ---
const REQUIRED_PHOTO_TYPES = ['frontal', 'right-lateral', 'left-lateral', 'lower', 'upper', 'upper-occlusal', 'lower-occlusal'];
const OPTIONAL_PHOTO_TYPES = ['face-closed-lips', 'face-smile', 'right-profile', 'left-profile'];
const PHOTO_LABELS: Record<string, string> = {
  'frontal': 'Frontal',
  'right-lateral': 'Right Lateral',
  'left-lateral': 'Left Lateral',
  'lower': 'Lower',
  'upper': 'Upper',
  'upper-occlusal': 'Upper Occlusal',
  'lower-occlusal': 'Lower Occlusal',
  'face-closed-lips': 'Face Closed Lips',
  'face-smile': 'Face Smile',
  'right-profile': 'Right Profile',
  'left-profile': 'Left Profile',
};
// --- End Constants ---

export default function PhotoCapture() {
  const [patientSession, setPatientSession] = useState<PatientSession | null>(null);
  const [practice, setPractice] = useState<Practice | null>(null);
  const [stagedRequiredPhotos, setStagedRequiredPhotos] = useState<StagedMedia[]>([]);
  const [stagedAdditionalPhotos, setStagedAdditionalPhotos] = useState<StagedMedia[]>([]);
  const [stagedVideos, setStagedVideos] = useState<StagedVideo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('before');
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoChunks = useRef<Blob[]>([]);
  const [currentVideoCategory, setCurrentVideoCategory] = useState<'before' | 'after' | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showVideoCamera, setShowVideoCamera] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<{category: 'before' | 'after', type: string} | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRecordRef = useRef<HTMLVideoElement>(null);

  // --- Utility & State Management Functions (Defined or Replaced from original code) ---

  useEffect(() => {
    const sessionId = searchParams.get('sessionId');
    const stepParam = searchParams.get('step') as WorkflowStep;
    const practice: Practice = JSON.parse(localStorage.getItem('practice') || '{}');
    if (practice) setPractice(practice);
    
    if (!sessionId) {
      router.push('/dashboard/workflow/patient-queue');
      return;
    }

    const sessions: PatientSession[] = JSON.parse(localStorage.getItem('patientSessions') || '[]');
    const session = sessions.find(s => s.sessionId === sessionId);
    
    if (!session) {
      router.push('/dashboard/workflow/patient-queue');
      return;
    }

    setPatientSession(session);
    setCurrentStep(stepParam || session.currentStep || 'before');
  }, [searchParams, router]);

  useEffect(() => {
    return () => {
      if (stream) {
        try {
          stream.getTracks().forEach(track => {
            if (track.readyState !== 'ended') {
              track.stop();
            }
          });
        } catch (error) {
          console.warn('Error stopping camera stream:', error);
        }
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stream]);

  const updatePatientSession = (updatedSession: PatientSession) => {
    const sessions: PatientSession[] = JSON.parse(localStorage.getItem('patientSessions') || '[]');
    const sessionIndex = sessions.findIndex(s => s.sessionId === updatedSession.sessionId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = updatedSession;
      localStorage.setItem('patientSessions', JSON.stringify(sessions));
      setPatientSession(updatedSession);    
    }
  };

  const startCamera = async (category: 'before' | 'after', type: string) => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });

        if (image.dataUrl) {
          const response = await fetch(image.dataUrl);
          const blob = await response.blob();
          const file = new File([blob], `${type}-${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          const newStagedPhoto: StagedMedia = {
            file,
            previewUrl: image.dataUrl,
            type,
            category,
          };
          
          if (type === 'additional') {
            setStagedAdditionalPhotos(prev => [...prev, newStagedPhoto]);
          } else {
            setStagedRequiredPhotos(prev => [...prev.filter(p => p.category !== category || p.type !== type), newStagedPhoto]);
          }
        }
      } catch (error) {
        console.error('Error taking photo:', error);
      }
    } else {
      setCurrentPhotoType({category, type});
      setShowCamera(true);
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
          setStream(mediaStream);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        toast.error('Could not access camera. Please check permissions.');
        setShowCamera(false);
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream || !currentPhotoType) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `${currentPhotoType.type}-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const newStagedPhoto: StagedMedia = {
            file,
            previewUrl: URL.createObjectURL(file),
            type: currentPhotoType.type,
            category: currentPhotoType.category,
          };
          
          if (currentPhotoType.type === 'additional') {
            setStagedAdditionalPhotos(prev => [...prev, newStagedPhoto]);
          } else {
            setStagedRequiredPhotos(prev => [...prev.filter(p => p.category !== currentPhotoType.category || p.type !== currentPhotoType.type), newStagedPhoto]);
          }
          
          closeCamera();
          toast.success(`${PHOTO_LABELS[currentPhotoType.type] || 'Photo'} staged successfully.`);
        }
      }, 'image/jpeg');
    }
  };

  const closeCamera = () => {
    if (stream) {
      try {
        stream.getTracks().forEach(track => {
          if (track.readyState !== 'ended') {
            track.stop();
          }
        });
      } catch (error) {
        console.warn('Error stopping camera stream:', error);
      }
      setStream(null);
    }
    setShowCamera(false);
    setCurrentPhotoType(null);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const startVideoCapture = async (category: 'before' | 'after') => {
    setCurrentVideoCategory(category);
    setShowVideoCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment'
        },
        audio: true
      });
      if (videoRecordRef.current) {
        videoRecordRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      console.error('Error accessing the camera:', err);
      toast.error('Could not access video camera. Please check permissions.');
      setShowVideoCamera(false);
    }
  };

  const closeVideoCamera = () => {
    if (stream) {
      try {
        stream.getTracks().forEach(track => {
          if (track.readyState !== 'ended') {
            track.stop();
          }
        });
      } catch (error) {
        console.warn('Error stopping video stream:', error);
      }
      setStream(null);
    }
    if (isRecording) {
      stopRecording();
    }
    setShowVideoCamera(false);
    setCurrentVideoCategory(null);
  };

  const startRecording = () => {
    if (!stream || !currentVideoCategory) {
      console.error('No camera stream or category available.');
      return;
    }
    videoChunks.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9,opus' });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        videoChunks.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const videoBlob = new Blob(videoChunks.current, { type: 'video/webm' });
      const videoFile = new File([videoBlob], `video-${currentVideoCategory}-${Date.now()}.webm`, { type: 'video/webm' });
      const newStagedVideo: StagedVideo = {
        file: videoFile,
        previewUrl: URL.createObjectURL(videoBlob),
        category: currentVideoCategory,
      };
      setStagedVideos(prev => [...prev, newStagedVideo]);
      closeVideoCamera();
      toast.success('Video staged successfully.');
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);

    setElapsedTime(0);
    timerRef.current = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.info('Recording stopped. Preparing file...');
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleRemoveStagedVideo = (videoToRemove: StagedVideo) => {
    try {
      URL.revokeObjectURL(videoToRemove.previewUrl);
    } catch (error) {
      console.warn('Error revoking object URL:', error);
    }
    setStagedVideos(prev => prev.filter(v => v.previewUrl !== videoToRemove.previewUrl));
    toast.info('Video removed from staging.');
  };

  const handleRequiredFileSelect = (event: React.ChangeEvent<HTMLInputElement>, category: 'before' | 'after', type: string) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const newStagedPhoto: StagedMedia = {
        file,
        previewUrl: URL.createObjectURL(file),
        type,
        category,
      };
      setStagedRequiredPhotos(prev => [...prev.filter(p => p.category !== category || p.type !== type), newStagedPhoto]);
      toast.success(`${PHOTO_LABELS[type]} uploaded and staged.`);
    }
  };

  const handleAdditionalFileSelect = (event: React.ChangeEvent<HTMLInputElement>, category: 'before' | 'after') => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      const newStagedPhotos: StagedMedia[] = files.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        type: 'additional',
        category,
      }));
      setStagedAdditionalPhotos(prev => [...prev, ...newStagedPhotos]);
      toast.success(`${newStagedPhotos.length} additional photos staged.`);
    }
  };

  const handleAdditionalVideoSelect = (event: React.ChangeEvent<HTMLInputElement>, category: 'before' | 'after') => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      const newStagedVideos: StagedVideo[] = files.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        category,
      }));
      setStagedVideos(prev => [...prev, ...newStagedVideos]);
      toast.success(`${newStagedVideos.length} videos staged for upload.`);
    }
  };

  const handleUploadPhotos = async () => {
    if (!patientSession || (!stagedRequiredPhotos.length && !stagedAdditionalPhotos.length && !stagedVideos.length)) return;
    setUploading(true);

    const formData = new FormData();
    const practiceId = practice?.id || ''; 
    const patientPhotoId = patientSession.sessionId;

    formData.append('practiceId', practiceId);
    formData.append('patientId', patientSession.patientId);
    formData.append('patientPhotoId', patientPhotoId);

    const allStagedMedia = stagedRequiredPhotos.filter(p => p.category === currentStep)
      .concat(stagedAdditionalPhotos.filter(p => p.category === currentStep));
    
    const currentStagedVideos = stagedVideos.filter(v => v.category === currentStep);

    // Add photos
    allStagedMedia.forEach((stagedPhoto, index) => {
      formData.append('mediaFiles', stagedPhoto.file, `${stagedPhoto.type}-${stagedPhoto.category}-${index}.jpg`);
      formData.append('categories', stagedPhoto.category);
      formData.append('mediaTypes', 'photo');
      formData.append('photoTypes', stagedPhoto.type);
    });
    
    // Add videos
    currentStagedVideos.forEach((stagedVideo, index) => {
      formData.append('mediaFiles', stagedVideo.file, `video-${stagedVideo.category}-${index}.webm`);
      formData.append('categories', stagedVideo.category);
      formData.append('mediaTypes', 'video');
    });

    try {
      const result: ApiResponse = await api.postFormData('/photo-session/upload-photos', formData);

      if (!result.success) {
        throw new Error(result.message2 || 'Failed to upload media.');
      }

      const updatedPhotos = currentStep === 'before' 
        ? [...(patientSession.beforePhotos || []), ...allStagedMedia.map(p => ({
            id: p.file.name + '-' + Date.now(),
            preview: p.previewUrl,
            category: p.category,
            type: p.type
          }))]
        : [...(patientSession.afterPhotos || []), ...allStagedMedia.map(p => ({
            id: p.file.name + '-' + Date.now(),
            preview: p.previewUrl,
            category: p.category,
            type: p.type
          }))];

      const updatedVideos = [...(patientSession.videos || []), ...currentStagedVideos.map(v => ({
        id: v.file.name + '-' + Date.now(),
        previewUrl: v.previewUrl,
        category: v.category
      }))];

      const updatedSession = {
        ...patientSession,
        currentStep: currentStep === 'before' ? 'after' as WorkflowStep : 'after' as WorkflowStep,
        ...(currentStep === 'before' 
          ? { beforePhotos: updatedPhotos }
          : { afterPhotos: updatedPhotos }
        ),
        videos: updatedVideos
      };

      updatePatientSession(updatedSession);
      toast.success('Media uploaded successfully!');


     try {
        // Send a separate request to update the last photo session timestamp
        const uSESSIONID = updatedSession.sessionId;
        await api.put(`/patients/${updatedSession.patientId}/last-photo-session`, { sessionId: uSESSIONID });
      } catch (updateError) {
        console.error('Failed to update last_photo_session:', updateError);
        // Continue flow despite timestamp update failure
      }

      // Clean up URLs and state
      allStagedMedia.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
      currentStagedVideos.forEach(video => URL.revokeObjectURL(video.previewUrl));

      setStagedRequiredPhotos(prev => prev.filter(p => p.category !== currentStep));
      setStagedAdditionalPhotos(prev => prev.filter(p => p.category !== currentStep));
      setStagedVideos(prev => prev.filter(v => v.category !== currentStep));

      // Redirect to the next step
      if (currentStep === 'before') {
        router.push(`/dashboard/workflow/photo-capture?sessionId=${updatedSession.sessionId}&step=after`);
      } else {
        router.push(`/dashboard/workflow/complete?sessionId=${updatedSession.sessionId}`);
      }

    } catch (error: any) {
      console.error('Failed to upload media:', error.message);
      toast.error(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleEnlargePhoto = (photoUrl: string) => {
    setEnlargedPhoto(photoUrl);
  };

  const handleCloseEnlarge = () => {
    setEnlargedPhoto(null);
  };

  const handleRemoveStagedPhoto = (photoToRemove: StagedMedia) => {
    try {
      URL.revokeObjectURL(photoToRemove.previewUrl);
    } catch (error) {
      console.warn('Error revoking object URL:', error);
    }
    if (photoToRemove.type === 'additional') {
      setStagedAdditionalPhotos(prev => prev.filter(p => p.previewUrl !== photoToRemove.previewUrl));
    } else {
      setStagedRequiredPhotos(prev => prev.filter(p => p.previewUrl !== photoToRemove.previewUrl));
    }
    toast.info('Photo removed from staging.');
  };

  const handleClearAllStagedPhotos = () => {
    const photosToClear = stagedRequiredPhotos.filter(p => p.category === currentStep)
      .concat(stagedAdditionalPhotos.filter(p => p.category === currentStep));

    photosToClear.forEach(photo => {
      try {
        URL.revokeObjectURL(photo.previewUrl);
      } catch (error) {
        console.warn('Error revoking object URL:', error);
      }
    });

    setStagedRequiredPhotos(prev => prev.filter(p => p.category !== currentStep));
    setStagedAdditionalPhotos(prev => prev.filter(p => p.category !== currentStep));
    setStagedVideos(prev => prev.filter(v => v.category !== currentStep));
    toast.info('All staged media cleared.');
  };

  const getStagedPhotoForType = (category: 'before' | 'after', type: string) => {
    return stagedRequiredPhotos.find(p => p.category === category && p.type === type);
  };

  const getExistingPhotosForType = (category: 'before' | 'after', type: string) => {
    if (!patientSession) return false;
    const photos = category === 'before' ? patientSession.beforePhotos : patientSession.afterPhotos;
    return photos.some(p => p.type === type);
  };

  const isUploadButtonDisabled = () => {
    const totalStaged = stagedRequiredPhotos.filter(p => p.category === currentStep).length + 
                        stagedAdditionalPhotos.filter(p => p.category === currentStep).length + 
                        stagedVideos.filter(v => v.category === currentStep).length;

    if (uploading || totalStaged === 0) {
      return true;
    }
    
    // Check if all required photos are either existing or staged
    const requiredCompleted = REQUIRED_PHOTO_TYPES.every(type => 
      getExistingPhotosForType(currentStep, type) || getStagedPhotoForType(currentStep, type)
    );

    return !requiredCompleted;
  };

  const getProgressValue = () => {
    if (!patientSession) return 0;
    const existingPhotos = currentStep === 'before' ? patientSession.beforePhotos : patientSession.afterPhotos;
    
    const requiredTypes = REQUIRED_PHOTO_TYPES.length;
    let completedCount = 0;

    REQUIRED_PHOTO_TYPES.forEach(type => {
        const isExisting = existingPhotos.some(p => p.type === type);
        const isStaged = stagedRequiredPhotos.some(p => p.category === currentStep && p.type === type);
        if (isExisting || isStaged) {
            completedCount++;
        }
    });
    
    return Math.min(100, Math.round((completedCount / requiredTypes) * 100));
  };

  // --- Render Logic ---

  if (!patientSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  const stepTitle = currentStep === 'before' ? 'Before Photos' : 'After Photos';
  const totalStagedMedia = 
    stagedRequiredPhotos.filter(p => p.category === currentStep).length + 
    stagedAdditionalPhotos.filter(p => p.category === currentStep).length + 
    stagedVideos.filter(v => v.category === currentStep).length;
    
  const requiredCompleted = getProgressValue() === 100;


  return (
    <div className="min-h-screen bg-gray-100 pb-28">
      {/* IMPROVEMENT: Consolidated Header with Progress */}
      <header className="bg-white border-b border-gray-200 shadow-lg sticky top-0 z-30 w-full">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard/workflow/patient-queue">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Patient Queue
              </Button>
            </Link>
            
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900">
                <span className="text-blue-600 mr-2">{stepTitle}</span> Capture
              </h1>
              <p className="text-sm text-gray-600">
                Patient: <strong className='text-gray-800'>{patientSession.patientName}</strong> | Procedure: <strong className='text-gray-800'>{patientSession.procedure || 'N/A'}</strong>
              </p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-600 text-white font-semibold py-1.5 px-3 shadow-md">
              STEP {currentStep === 'before' ? '1' : '2'}
            </Badge>
            <Progress value={getProgressValue()} className="w-32 h-2.5 bg-gray-200" />
            <span className="text-sm font-semibold text-gray-800">{getProgressValue()}%</span>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* IMPROVEMENT: Consolidated Capture & Required Photos Card */}
        <Card className="shadow-xl mb-8 border-t-4 border-blue-600">
          <CardHeader>
            <CardTitle className="text-2xl">Capture Required Media</CardTitle>
            <CardDescription>
              Use the camera or upload files to complete all required **{stepTitle}** photos.
              {Capacitor.isNativePlatform() ? ' (Native Camera)' : ' (Browser Camera)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* A. Required Photos Grid (Interactive Tiles) */}
            <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">
                Required Photos {requiredCompleted && (<CheckCircle2 className='h-5 w-5 text-green-600 inline-block ml-2' />)}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {REQUIRED_PHOTO_TYPES.map(type => {
                const isExisting = getExistingPhotosForType(currentStep, type);
                const isStaged = getStagedPhotoForType(currentStep, type);
                const hasPhoto = isExisting || isStaged;
                
                return (
                  <div key={type} className="space-y-2">
                    <div 
                      className={`p-4 rounded-lg flex flex-col items-center justify-center space-y-2 transition-all duration-200 relative ${
                        isExisting
                          ? 'bg-green-500/10 border border-green-400'
                          : isStaged 
                            ? 'bg-blue-500/10 border border-blue-400'
                            : 'bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer'
                      }`}
                      onClick={() => { if (!hasPhoto) startCamera(currentStep, type); }}
                    >
                      {hasPhoto ? (
                        <CheckCircle2 className={`h-8 w-8 ${isExisting ? 'text-green-600' : 'text-blue-600'}`} />
                      ) : (
                        <Camera className="h-8 w-8 text-gray-500" />
                      )}
                      <p className={`text-center font-medium text-sm text-gray-900`}>
                        {PHOTO_LABELS[type]}
                      </p>
                      <p className={`text-xs ${isExisting ? 'text-green-600' : isStaged ? 'text-blue-600' : 'text-red-500'}`}>
                        {isExisting ? 'Completed' : isStaged ? 'Staged' : 'Tap to Capture'}
                      </p>
                      
                      {/* Remove/Enlarge button for staged photos */}
                      {isStaged && (
                        <div className='absolute top-1 right-1 flex space-x-1'>
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleEnlargePhoto(isStaged.previewUrl); }}
                            size='icon'
                            variant='ghost'
                            className='h-7 w-7 text-white bg-gray-900/50 hover:bg-gray-800/70 p-1'
                          >
                              <Plus className='h-4 w-4' />
                          </Button>
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleRemoveStagedPhoto(isStaged); }}
                            size='icon'
                            variant='ghost'
                            className='h-7 w-7 text-white bg-red-500/80 hover:bg-red-600/90 p-1'
                          >
                              <XCircle className='h-4 w-4' />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload button outside the box */}
                    {!hasPhoto && (
                        <>
                        <input
                            type="file"
                            ref={el => (fileInputRefs.current[`${currentStep}-${type}`] = el)}
                            onChange={(e) => handleRequiredFileSelect(e, currentStep, type)}
                            className="hidden"
                            accept="image/*"
                        />
                        <Button
                            onClick={() => fileInputRefs.current[`${currentStep}-${type}`]?.click()}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                            Upload from Device
                        </Button>
                        </>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* B. Optional Photos Grid */}
            <h3 className="font-semibold text-lg text-gray-700 border-b pb-2 mt-8">Optional Photos (Suggested)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {OPTIONAL_PHOTO_TYPES.map(type => {
                const isExisting = getExistingPhotosForType(currentStep, type);
                const isStaged = getStagedPhotoForType(currentStep, type);
                const hasPhoto = isExisting || isStaged;
                
                return (
                  <div key={type} className="space-y-2">
                    <div 
                      className={`p-4 rounded-lg flex flex-col items-center justify-center space-y-2 transition-all duration-200 relative ${
                        isExisting
                          ? 'bg-green-500/10 border border-green-400'
                          : isStaged 
                            ? 'bg-blue-500/10 border border-blue-400'
                            : 'bg-white border-2 border-dashed border-gray-300 hover:border-purple-500 cursor-pointer'
                      }`}
                      onClick={() => { if (!hasPhoto) startCamera(currentStep, type); }}
                    >
                      {hasPhoto ? (
                        <CheckCircle2 className={`h-8 w-8 ${isExisting ? 'text-green-600' : 'text-blue-600'}`} />
                      ) : (
                        <Camera className="h-8 w-8 text-gray-500" />
                      )}
                      <p className={`text-center font-medium text-sm text-gray-900`}>
                        {PHOTO_LABELS[type]}
                      </p>
                      <p className={`text-xs ${isExisting ? 'text-green-600' : isStaged ? 'text-blue-600' : 'text-purple-500'}`}>
                        {isExisting ? 'Completed' : isStaged ? 'Staged' : 'Optional'}
                      </p>
                      
                      {/* Remove/Enlarge button for staged photos */}
                      {isStaged && (
                        <div className='absolute top-1 right-1 flex space-x-1'>
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleEnlargePhoto(isStaged.previewUrl); }}
                            size='icon'
                            variant='ghost'
                            className='h-7 w-7 text-white bg-gray-900/50 hover:bg-gray-800/70 p-1'
                          >
                              <Plus className='h-4 w-4' />
                          </Button>
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleRemoveStagedPhoto(isStaged); }}
                            size='icon'
                            variant='ghost'
                            className='h-7 w-7 text-white bg-red-500/80 hover:bg-red-600/90 p-1'
                          >
                              <XCircle className='h-4 w-4' />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload button outside the box */}
                    {!hasPhoto && (
                        <>
                        <input
                            type="file"
                            ref={el => (fileInputRefs.current[`${currentStep}-${type}`] = el)}
                            onChange={(e) => handleRequiredFileSelect(e, currentStep, type)}
                            className="hidden"
                            accept="image/*"
                        />
                        <Button
                            onClick={() => fileInputRefs.current[`${currentStep}-${type}`]?.click()}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs border-purple-300 text-purple-600 hover:bg-purple-50"
                        >
                            Upload from Device
                        </Button>
                        </>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* C. Additional Media Actions */}
            <h3 className="font-semibold text-lg text-gray-700 border-b pb-2 mt-8">Additional Media Capture</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                    onClick={() => startCamera(currentStep, 'additional')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Take Additional Photo
                </Button>
                <Button
                    onClick={() => startVideoCapture(currentStep)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white h-11"
                >
                    <Video className="h-4 w-4 mr-2" />
                    Record Optional Video
                </Button>
            </div>
          </CardContent>
        </Card>


        {/* IMPROVEMENT: Consolidated Staged Media Card */}
        {totalStagedMedia > 0 && (
          <Card className="shadow-lg mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Media Ready for Upload ({totalStagedMedia} files)</CardTitle>
                <CardDescription>
                  Review and remove any media staged for **{stepTitle}**.
                </CardDescription>
              </div>
              <Button
                onClick={handleClearAllStagedPhotos}
                variant="outline"
                size="sm"
                className="w-fit border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Clear All Staged
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Staged Required Photos */}
                {stagedRequiredPhotos.filter(p => p.category === currentStep).map(photo => (
                  <div key={photo.previewUrl} className="relative group cursor-pointer" onClick={() => handleEnlargePhoto(photo.previewUrl)}>
                    <Image
                      src={photo.previewUrl}
                      alt={`Staged ${PHOTO_LABELS[photo.type]}`}
                      width={200}
                      height={200}
                      className="rounded-lg object-cover w-full h-full aspect-square"
                    />
                    <Badge className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs">{PHOTO_LABELS[photo.type]}</Badge>
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleRemoveStagedPhoto(photo); }}
                      className="absolute top-2 right-2 p-1 h-auto w-auto rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {/* Staged Additional Photos */}
                {stagedAdditionalPhotos.filter(p => p.category === currentStep).map(photo => (
                  <div key={photo.previewUrl} className="relative group cursor-pointer" onClick={() => handleEnlargePhoto(photo.previewUrl)}>
                    <Image
                      src={photo.previewUrl}
                      alt="Staged additional photo"
                      width={200}
                      height={200}
                      className="rounded-lg object-cover w-full h-full aspect-square"
                    />
                    <Badge className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs">Additional Photo</Badge>
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleRemoveStagedPhoto(photo); }}
                      className="absolute top-2 right-2 p-1 h-auto w-auto rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Staged Videos */}
                {stagedVideos.filter(v => v.category === currentStep).map((video, index) => (
                  <div key={video.previewUrl} className="relative group cursor-pointer">
                    <video
                      src={video.previewUrl}
                      controls
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <Badge className="absolute bottom-2 left-2 bg-red-600 text-white text-xs">Video {index + 1}</Badge>
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleRemoveStagedVideo(video); }}
                      className="absolute top-2 right-2 p-1 h-auto w-auto rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* IMPROVEMENT: Separate Uploads Card (for files, not camera) */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>File Uploads (Device Storage)</CardTitle>
            <CardDescription>
              Use this option to upload media already saved on your device (optional).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="file"
                  ref={el => (fileInputRefs.current[`additional-photos-${currentStep}`] = el)}
                  onChange={(e) => handleAdditionalFileSelect(e, currentStep)}
                  className="hidden"
                  accept="image/*"
                  multiple
                />
                <Button
                  onClick={() => fileInputRefs.current[`additional-photos-${currentStep}`]?.click()}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 h-11"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Photos
                </Button>
              </div>
              <div>
                <input
                  type="file"
                  ref={el => (fileInputRefs.current[`additional-videos-${currentStep}`] = el)}
                  onChange={(e) => handleAdditionalVideoSelect(e, currentStep)}
                  className="hidden"
                  accept="video/*"
                  multiple
                />
                <Button
                  onClick={() => fileInputRefs.current[`additional-videos-${currentStep}`]?.click()}
                  variant="outline"
                  className="w-full border-red-600 text-red-600 hover:bg-red-50 h-11"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Upload Videos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* IMPROVEMENT: Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 p-4 bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex flex-col text-sm font-medium">
            <span className="text-gray-600">Total Staged Files:</span>
            <span className="text-gray-900 font-semibold">{totalStagedMedia}</span>
          </div>
          
          <Button
            onClick={handleUploadPhotos}
            disabled={isUploadButtonDisabled() || uploading}
            className={`w-full md:w-auto transition-all duration-300 ${
                isUploadButtonDisabled() 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            size="lg"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
              <UploadCloud className="h-5 w-5 mr-3" />
            )}
            {uploading 
                ? 'Uploading Media...' 
                : requiredCompleted 
                    ? `Upload ${stepTitle} & Proceed`
                    : 'Complete Required Photos'
            }
          </Button>
        </div>
      </div>

      {/* Camera Modal for Web Photos */}
      {showCamera && (
        <div className="fixed top-0 left-0 w-full h-full z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full max-w-4xl max-h-4xl bg-black">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
              <Button
                onClick={capturePhoto}
                className="bg-white text-black hover:bg-gray-200 rounded-full w-16 h-16"
              >
                <Camera className="h-8 w-8" />
              </Button>
              <Button
                onClick={closeCamera}
                className="bg-red-500 text-white hover:bg-red-600 rounded-full w-16 h-16"
              >
                <XCircle className="h-8 w-8" />
              </Button>
            </div>
            {currentPhotoType && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                Taking: {PHOTO_LABELS[currentPhotoType.type] || 'Additional Photo'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL-SCREEN VIDEO RECORDING MODAL */}
      {showVideoCamera && (
        <div className="fixed top-0 left-0 w-full h-full z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full bg-black">
            <video 
              ref={videoRecordRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            
            {/* Recording Timer */}
            {isRecording && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
              </div>
            )}
            
            {/* Recording Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="bg-red-500 text-white hover:bg-red-600 rounded-full w-20 h-20"
                >
                  <Video className="h-10 w-10" />
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="bg-red-500 text-white hover:bg-red-600 rounded-full w-20 h-20"
                >
                  <Pause className="h-10 w-10" />
                </Button>
              )}
              
              <Button
                onClick={closeVideoCamera}
                className="bg-gray-500 text-white hover:bg-gray-600 rounded-full w-20 h-20"
                disabled={isRecording}
              >
                <XCircle className="h-10 w-10" />
              </Button>
            </div>
            
            {/* Instructions */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
              {!isRecording ? 'Tap red button to start recording' : 'Recording in progress...'}
            </div>
          </div>
        </div>
      )}

      {/* Enlarged photo modal */}
      {enlargedPhoto && (
        <div
          className="fixed top-0 left-0 w-full h-full z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={handleCloseEnlarge}
        >
          <div className="relative max-w-4xl max-h-4xl bg-white rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <Image
              src={enlargedPhoto}
              alt="Enlarged photo"
              width={1024}
              height={768}
              className="object-contain"
            />
            <Button
              onClick={handleCloseEnlarge}
              className="absolute top-2 right-2 p-1 h-auto w-auto rounded-full bg-red-500 text-white"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}