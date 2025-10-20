'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Calendar, 
  Download, 
  FileText, 
  Camera, 
  Eye, 
  X,
  CheckCircle2,
  User,
  Clock,
  Filter,
  ArrowLeft,
  ZoomIn,
  ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/components/lib/api';

interface CompletedSession {
  id: string;
  patientName: string;
  procedure: string;
  completedDate: string;
  beforePhotos: MediaFile[];
  afterPhotos: MediaFile[];
  videos: MediaFile[];
  consentPdfs: MediaFile[];
  totalFiles: number;
}

interface MediaFile {
  id: string;
  fileName: string;
  fileType: 'image' | 'pdf' | 'video';
  fileSize: number;
  url: string;
  thumbnail?: string;
}

export default function CompletedSessionsPage() {
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<CompletedSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null);
  const [activeTab, setActiveTab] = useState('before');
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [viewingFile, setViewingFile] = useState<MediaFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCompletedSessions();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadCompletedSessions();
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, dateRange]);

  useEffect(() => {
    filterSessions();
  }, [sessions]);

  const loadCompletedSessions = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      
      const token = localStorage.getItem('token');
      const response = await api.get(`/completed-sessions?${params.toString()}`, token);
      
      if (response.success) {
        setSessions(response.data || []);
      } else {
        console.error('Failed to load sessions:', response.message2);
        setSessions([]);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = sessions;

    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.procedure.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateRange.start) {
      filtered = filtered.filter(session =>
        new Date(session.completedDate) >= new Date(dateRange.start)
      );
    }

    if (dateRange.end) {
      filtered = filtered.filter(session =>
        new Date(session.completedDate) <= new Date(dateRange.end)
      );
    }

    setFilteredSessions(filtered);
  };

  const toggleFileSelection = (file: MediaFile) => {
    setSelectedFiles(prev =>
      prev.find(f => f.id === file.id)
        ? prev.filter(f => f.id !== file.id)
        : [...prev, file]
    );
  };

  const downloadSelected = async () => {
    for (const file of selectedFiles) {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get(`/completed-sessions/download/${encodeURIComponent(file.url)}`, token);
        
        if (response.success && response.data?.url) {
          const link = document.createElement('a');
          link.href = response.data.url;
          link.download = file.fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Fallback to direct URL
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (error) {
        console.error('Download failed for', file.fileName, error);
        // Fallback to direct URL
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
    setSelectedFiles([]);
  };

  const selectAllFiles = (files: MediaFile[]) => {
    const newSelections = files.filter(file => !selectedFiles.find(f => f.id === file.id));
    setSelectedFiles(prev => [...prev, ...newSelections]);
  };

  const downloadAllFiles = async (files: MediaFile[]) => {
    for (const file of files) {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get(`/completed-sessions/download/${encodeURIComponent(file.url)}`, token);
        
        if (response.success && response.data?.url) {
          const link = document.createElement('a');
          link.href = response.data.url;
          link.download = file.fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Fallback to direct URL
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (error) {
        console.error('Download failed for', file.fileName, error);
        // Fallback to direct URL
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const MediaViewer = ({ files, type }: { files: MediaFile[], type: string }) => {
    return (
      <div>
        {files.length > 0 && (
          <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">{files.length} files</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectAllFiles(files)}
              >
                Select All
              </Button>
              <Button
                size="sm"
                onClick={() => downloadAllFiles(files)}
              >
                <Download className="h-4 w-4 mr-1" />
                Download All
              </Button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map(file => (
        <div key={file.id} className="relative group">
          <div 
            className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
              selectedFiles.find(f => f.id === file.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => toggleFileSelection(file)}
          >
            {file.fileType === 'image' ? (
              <div className="aspect-square bg-gray-100">
                <Image
                  src={file.thumbnail || file.url}
                  alt={file.fileName}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for broken images
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200"><span class="text-gray-500 text-xs">Image unavailable</span></div>';
                    }
                  }}
                />
              </div>
            ) : file.fileType === 'video' ? (
              <div className="aspect-square bg-blue-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">Video</span>
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-red-50 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-red-500 mb-2" />
                  <span className="text-xs text-red-600 font-medium">PDF</span>
                </div>
              </div>
            )}
            
            {/* Selection indicator */}
            <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selectedFiles.find(f => f.id === file.id) 
                ? 'bg-blue-500 border-blue-500' 
                : 'bg-white border-gray-300'
            }`}>
              {selectedFiles.find(f => f.id === file.id) && (
                <CheckCircle2 className="h-4 w-4 text-white" />
              )}
            </div>

            {/* View button */}
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setViewingFile(file);
              }}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-2">
            <p className="text-sm font-medium truncate" title={file.fileName}>{file.fileName}</p>
            <p className="text-xs text-gray-500">
              {file.fileSize > 0 ? `${(file.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Size unknown'}
            </p>
          </div>
        </div>
      ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">

              <div>
                <h1 className="text-2xl font-bold text-gray-900">Completed Sessions</h1>
                <p className="text-sm text-gray-500">{filteredSessions.length} completed photo sessions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name or procedure..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                type="date"
                placeholder="Start date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <Input
                type="date"
                placeholder="End date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSessions.map(session => (
            <Card key={session.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {session.patientName}
                    </CardTitle>
                    <CardDescription>{session.procedure}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {format(new Date(session.completedDate), 'PPP')}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={session.consentPdfs.length === 0}
                      onClick={() => {
                        setSelectedSession(session);
                        setActiveTab('pdfs');
                      }}
                    >
                      <FileText className="h-4 w-4" />
                      PDFs ({session.consentPdfs.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={session.videos.length === 0}
                      onClick={() => {
                        setSelectedSession(session);
                        setActiveTab('videos');
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      Videos ({session.videos.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={session.beforePhotos.length === 0}
                      onClick={() => {
                        setSelectedSession(session);
                        setActiveTab('before');
                      }}
                    >
                      <Camera className="h-4 w-4" />
                      Before ({session.beforePhotos.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={session.afterPhotos.length === 0}
                      onClick={() => {
                        setSelectedSession(session);
                        setActiveTab('after');
                      }}
                    >
                      <Camera className="h-4 w-4" />
                      After ({session.afterPhotos.length})
                    </Button>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">{session.totalFiles} total files</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Media Viewer Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold">{selectedSession.patientName} - Media Files</h2>
                <div className="flex items-center gap-2">
                  {selectedFiles.length > 0 && (
                    <Button onClick={downloadSelected} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download Selected ({selectedFiles.length})
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setSelectedSession(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="pdfs">PDFs ({selectedSession.consentPdfs.length})</TabsTrigger>
                    <TabsTrigger value="videos">Videos ({selectedSession.videos.length})</TabsTrigger>
                    <TabsTrigger value="before">Before ({selectedSession.beforePhotos.length})</TabsTrigger>
                    <TabsTrigger value="after">After ({selectedSession.afterPhotos.length})</TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4 max-h-96 overflow-y-auto">
                    <TabsContent value="pdfs">
                      <MediaViewer files={selectedSession.consentPdfs} type="pdf" />
                    </TabsContent>
                    <TabsContent value="videos">
                      <MediaViewer files={selectedSession.videos} type="video" />
                    </TabsContent>
                    <TabsContent value="before">
                      <MediaViewer files={selectedSession.beforePhotos} type="image" />
                    </TabsContent>
                    <TabsContent value="after">
                      <MediaViewer files={selectedSession.afterPhotos} type="image" />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
        )}

        {/* Full Screen Image Viewer */}
        {viewingFile && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div className="relative max-w-4xl max-h-full">
              <Button
                variant="outline"
                className="absolute top-4 right-4 z-10"
                onClick={() => setViewingFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              {viewingFile.fileType === 'image' ? (
                <Image
                  src={viewingFile.url}
                  alt={viewingFile.fileName}
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain"
                />
              ) : viewingFile.fileType === 'video' ? (
                <video
                  src={viewingFile.url}
                  controls
                  className="max-w-full max-h-full"
                  title={viewingFile.fileName}
                />
              ) : (
                <iframe
                  src={viewingFile.url}
                  className="w-full h-96"
                  title={viewingFile.fileName}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}