'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, UploadCloud, XCircle, Play, Pause, Video, CheckCircle2, SkipForward, Camera } from 'lucide-react';
import Link from 'next/link';
import { api, ApiResponse } from '@/components/lib/api';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner'; // Assuming sonner is available for toasts

// --- Interface Definitions (Unchanged) ---
interface StagedVideo {
  file: File;
  previewUrl: string;
  category: 'before' | 'after';
}

interface PatientSession {
  sessionId: string;
  patientId: string;
  patientName: string;
  procedure: string;
  currentStep: string;
  beforePhotos: any[];
  afterPhotos: any[];
  videos: any[];
  createdAt: string;
}
// --- End Interface Definitions ---

export default function VideoCapture() {
  const [patientSession, setPatientSession] = useState<PatientSession | null>(null);
  const [stagedVideos, setStagedVideos] = useState<StagedVideo[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoChunks = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- Lifecycle & Utility Functions (Unchanged logic) ---

  useEffect(() => {
    const sessionId = searchParams.get('sessionId');
    
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
          console.warn('Error stopping video stream:', error);
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const startVideoCapture = async () => {
    setShowCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment'
        },
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      console.error('Error accessing the camera:', err);
      toast.error('Could not access camera. Please check permissions.');
      setShowCamera(false);
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
        console.warn('Error stopping video stream:', error);
      }
      setStream(null);
    }
    if (isRecording) {
      stopRecording();
    }
    setShowCamera(false);
  };

  const startRecording = () => {
    if (!stream) {
      console.error('No camera stream available.');
      return;
    }
    videoChunks.current = [];
    // Prioritize a widely supported format
    const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') ? 'video/webm; codecs=vp9' : 'video/webm'; 
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        videoChunks.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const videoBlob = new Blob(videoChunks.current, { type: mimeType });
      const videoFile = new File([videoBlob], `video-${Date.now()}.webm`, { type: mimeType });
      const newStagedVideo: StagedVideo = {
        file: videoFile,
        previewUrl: URL.createObjectURL(videoBlob),
        category: 'after', // Assuming video capture is always for 'after' step here
      };
      setStagedVideos(prev => [...prev, newStagedVideo]);
      closeCamera();
      toast.success('Video recorded and staged!');
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
  
  const handleManualFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      const newStagedVideos: StagedVideo[] = files.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        category: 'after',
      }));
      setStagedVideos(prev => [...prev, ...newStagedVideos]);
      event.target.value = '';
      toast.success(`${files.length} videos staged for upload.`);
    }
  };

  const handleUploadVideos = async () => {
    if (!patientSession || !stagedVideos.length) return;
    setUploading(true);

    const formData = new FormData();
    const practiceId = 'DENT001'; // Placeholder
    const patientPhotoId = patientSession.sessionId;

    formData.append('practiceId', practiceId);
    formData.append('patientId', patientSession.patientId); // Use patientId for backend consistency
    formData.append('patientPhotoId', patientPhotoId);
    
    stagedVideos.forEach((stagedVideo, index) => {
      formData.append('mediaFiles', stagedVideo.file, `video-${stagedVideo.category}-${index}.webm`);
      formData.append('categories', stagedVideo.category);
      formData.append('mediaTypes', 'video');
    });

    try {
      const result: ApiResponse = await api.postFormData('/upload/media', formData);

      if (!result.success) {
        throw new Error(result.message2 || 'Failed to upload videos.');
      }

      const updatedSession = {
        ...patientSession,
        videos: [...patientSession.videos, ...stagedVideos.map(v => ({
          id: v.file.name + '-' + Date.now(),
          previewUrl: v.previewUrl,
          category: v.category
        }))]
      };

      updatePatientSession(updatedSession);

      // Clean up and reset
      stagedVideos.forEach(video => URL.revokeObjectURL(video.previewUrl));
      setStagedVideos([]);
      toast.success('Videos uploaded! Workflow complete.');
      
      router.push(`/dashboard/workflow/complete?sessionId=${updatedSession.sessionId}`);

    } catch (error: any) {
      console.error('Failed to upload videos:', error.message);
      toast.error(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSkipVideos = () => {
    if (patientSession) {
      toast.info('Skipping video capture. Finalizing workflow...');
      router.push(`/dashboard/workflow/complete?sessionId=${patientSession.sessionId}`);
    }
  };

  if (!patientSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    );
  }
  
  const totalStaged = stagedVideos.length;

  // --- Final Render ---

  return (
    <div className="min-h-screen bg-gray-100 pb-28"> {/* Increased padding bottom for fixed bar */}
      
      {/* IMPROVED HEADER */}
      <header className="bg-white border-b border-gray-200 shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/workflow/patient-queue">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Patient Queue
              </Button>
            </Link>
            
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900">
                <span className="text-red-600 mr-2">Optional Video</span> Capture
              </h1>
              <p className="text-sm text-gray-600">
                Patient: <strong className='text-gray-800'>{patientSession.patientName}</strong> | Procedure: <strong className='text-gray-800'>{patientSession.procedure || 'N/A'}</strong>
              </p>
            </div>
          </div>
          <Badge className="bg-green-600 text-white font-semibold py-1.5 px-3 shadow-md">
            FINAL STEP (3 of 3)
          </Badge>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* CONSOLIDATED ACTION CARD */}
        <Card className="shadow-xl mb-8 border-t-4 border-red-600">
          <CardHeader>
            <CardTitle className="text-2xl">Record or Upload Videos</CardTitle>
            <CardDescription>
              Capture optional video footage of the patient's results. This is the final step before completion.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Start Recording Button */}
            <Button
              onClick={startVideoCapture}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base"
              disabled={showCamera || uploading}
            >
              <Video className="h-5 w-5 mr-2" />
              Start New Recording
            </Button>
            
            {/* Upload Existing Button */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleManualFileSelect}
                className="hidden"
                accept="video/*"
                multiple
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full h-12 text-base border-gray-400 text-gray-700 hover:bg-gray-100"
                disabled={uploading}
              >
                <UploadCloud className="h-5 w-5 mr-2" />
                Upload Existing Videos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* STAGED VIDEOS CARD */}
        {totalStaged > 0 && (
          <Card className="shadow-lg mb-8">
            <CardHeader>
              <CardTitle>Videos Staged for Upload ({totalStaged})</CardTitle>
              <CardDescription>
                Review and play your recorded videos before finalizing the upload.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stagedVideos.map((video, index) => (
                  <div key={video.previewUrl} className="relative group bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      src={video.previewUrl}
                      controls
                      className="w-full aspect-video object-cover"
                    />
                    <Badge className="absolute bottom-2 left-2 bg-red-500 text-white shadow-md">
                      Video {index + 1}
                    </Badge>
                    <Button
                      onClick={() => handleRemoveStagedVideo(video)}
                      size="icon"
                      className="absolute top-2 right-2 p-1 h-8 w-8 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* IMPROVED STICKY ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 p-4 bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-7xl mx-auto flex gap-4">
          
          {/* Skip Button (Secondary Action) */}
          <Button
            onClick={handleSkipVideos}
            variant="outline"
            className="flex-1 max-w-[200px] border-gray-300 text-gray-600 hover:bg-gray-50"
            disabled={uploading}
            size="lg"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip & Complete
          </Button>
          
          {/* Upload Button (Primary Action) */}
          <Button
            onClick={handleUploadVideos}
            disabled={uploading || totalStaged === 0}
            className={`flex-1 ${
                totalStaged === 0 
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
            {uploading ? 'Uploading...' : `Upload ${totalStaged} Videos & Finish`}
          </Button>
        </div>
      </div>

      {/* FULL-SCREEN VIDEO RECORDING MODAL (Unchanged) */}
      {showCamera && (
        <div className="fixed top-0 left-0 w-full h-full z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full bg-black">
            <video 
              ref={videoRef} 
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
                onClick={closeCamera}
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
    </div>
  );
}