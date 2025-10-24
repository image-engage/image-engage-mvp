'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import { format as formatDate } from 'date-fns';
import { toast } from 'sonner';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  MessageSquare, 
  Download, 
  Eye, 
  Calendar, 
  Search, 
  Loader2, 
  AlertCircle, 
  X, 
  Video, 
  CheckCircle,
  ChevronLeft, // 👈 NEW: Icon for mobile back button
  Play, // 👈 NEW: Icon for Slideshow button
  Pause, // 👈 NEW: Icon for Slideshow pause
  ChevronRight, // 👈 NEW: Icon for Slideshow next
  FileText, // 👈 NEW: Icon for PDF button
} from "lucide-react";
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { api, ApiError, ApiResponse } from '@/components/lib/api';


interface Practice {
  id: string;
  name: string;
  isonboarded: boolean;
  google_drive_folder_id: string | null;
}

// --- UTILITY FIX: Class Name Resolver (Required for Tailwind class merging) ---
const cn = (...classes: (string | boolean | undefined | null)[]) => {
    return classes.filter(Boolean).join(' ');
};

// --- API CONFIGURATION & CORE UTILITY (REFACTORED) ---
// Note: In a real project, this logic (ApiError and api object) would be imported 
// from a separate file like src/lib/api.ts. We re-implement it here for the single-file environment.
const API_BASE_URL = 'http://localhost:3001/api';
const PRACTICE_ID = 'DENT001'; 


// MOCK TOKEN: IMPORTANT FIX for 401 Unauthorized Error
// In a real application, replace this with a secure method to retrieve the actual user's JWT.
//const MOCK_USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcmFjdGljZUlkIjoiYTIyMTc5MGItZTEzMC00MDhjLWFiYWQtNWJkZTgzZDA5ZWM0IiwiZW1haWwiOiJhZG1pbkBkZW50YWwuY29tIiwidXNlcklkIjoiM2MyMmIzNDUtMzMwOS00YjgzLThhOWUtNmZjMTJkY2JiZWIyIiwiaWF0IjoxNzU5MTE1MjI0LCJleHAiOjE3NTk3MjAwMjR9.a9vmqCSbp_sEbdqnh8YssN96k0ZB3D2obn8NdR9eTdU'
/**
 * Helper function to get the authentication token
 */
const getAuthToken = (): string | undefined => {
  // Check if we are running in a client-side environment (i.e., not during server-side rendering in Next.js)
  if (typeof window !== 'undefined') {
    // Attempt to retrieve the token stored under the key "token"
    const token = localStorage.getItem('token');
    return token || undefined; // Return the token string or undefined if not found
  }
  return undefined; 
};


// --- TYPE DEFINITIONS ---
type MediaStatus = 'uploaded' | 'pending_editing' | 'edited';
type MediaCategory = 'before' | 'after' | 'other';

interface Patient {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    procedure_type?: string;
    last_photo_session: string | null; // This field holds the session ID from the backend.
}

interface MediaFile {
    id: string;
    patientId: string;
    fileName: string;
    fileType: 'image' | 'video';
    mediaCategory: MediaCategory;
    fileSize: number;
    uploadDate: Date;
    preview: string; // This would be the storage_url
    mediaStatus: MediaStatus;
    dentalAssistantNotes?: string;
    editedAt?: Date;
}

// Expected structure for the media file list API response
interface MediaApiResponse {
    data?: {
        files?: any[]; // The raw file array
    }
}

// --- DATA MAPPING HELPERS ---

/**
 * Maps raw file objects returned from the media API endpoint 
 * This is now designed to work with the response from the new photo-session endpoint.
 */
const mapRawMedia = (sessionData: any, patientId: string): MediaFile[] => {
    if (!sessionData || !Array.isArray(sessionData.file_urls)) {
        return [];
    }

    // The photo_type is a comma-separated string, e.g., "before,before,after"
    const categories = (sessionData.photo_type || '').split(',');

    return sessionData.file_urls.map((url: string, index: number) => {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return {
        // We generate a client-side ID since the session record doesn't have individual file IDs
        id: `${sessionData.id}-${index}`,
        patientId: patientId,
        fileName: fileName,
        fileType: 'image', // Assuming all files fetched are images for simplicity
        mediaCategory: (categories[index] || 'other') as MediaCategory,
        fileSize: 0, // file_size is not available in photo_sessions table
        uploadDate: new Date(sessionData.session_date),
        preview: url,
        mediaStatus: 'uploaded', 
        dentalAssistantNotes: undefined,
        editedAt: undefined,
    }});
};

// --- SUB-COMPONENTS (MOBILE-FRIENDLY ADJUSTMENTS) ---

interface RawMediaCardProps {
    file: MediaFile;
    patientName: string;
    onViewDetails: (file: MediaFile) => void;
    selectable?: boolean;
    isSelected?: boolean;
    onSelect?: (fileId: string) => void;
}

const RawMediaCard = ({ file, patientName, onViewDetails, selectable, isSelected, onSelect }: RawMediaCardProps) => (
    <Card key={file.id} className="overflow-hidden relative group hover:shadow-xl transition-all duration-200">
        {selectable && (
            <div className="absolute top-3 left-3 z-10">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect?.(file.id)}
                    className="h-5 w-5 border-2 border-white data-[state=checked]:border-blue-500 bg-white/80"
                />
            </div>
        )}
        <div className="aspect-square bg-gray-100 relative">
            <img
                src={file.preview || 'https://placehold.co/300x300/e2e8f0/000?text=No+Preview'}
                alt={file.fileName}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            {/* Adjusted Badge positioning and content for better fit on small screens */}
            <div className="absolute top-2 right-2 flex space-x-1">
                <Badge variant="secondary" className="text-xs p-1 h-auto leading-none">{file.fileType === 'image' ? 'IMG' : <Video className='h-3 w-3' />}</Badge>
                <Badge className={cn(`text-xs p-1 h-auto leading-none`,
                    file.mediaStatus === 'uploaded' ? 'bg-purple-100 text-purple-800' :
                    file.mediaStatus === 'pending_editing' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                )}>
                    {/* Shorten status text for mobile view */}
                    {file.mediaStatus.split('_')[0]} 
                </Badge>
            </div>
            {file.dentalAssistantNotes && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 flex items-center gap-1">
                    <MessageSquare size={12} /> <span className="truncate">Notes</span>
                </div>
            )}
        </div>
        <CardContent className="p-3">
            <p className="text-sm font-medium truncate">{file.fileName}</p>
            <p className="text-xs text-gray-600">Cat: <span className="capitalize font-semibold text-gray-800">{file.mediaCategory}</span></p>
            <div className="flex items-center justify-between mt-1 text-gray-500">
                <span className="text-xs">{(file.fileSize / 1024).toFixed(0)} KB</span>
                <span className="text-xs">{formatDate(new Date(file.uploadDate), 'MMM d')}</span> {/* Shorten date format */}
            </div>
            <div className="mt-3">
                <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => onViewDetails(file)}>
                    <Eye className="h-3 w-3 mr-1" /> Details
                </Button>
            </div>
        </CardContent>
    </Card>
);


// --- MAIN COMPONENT: Media Management Layout ---
export default function PatientMediaDashboard() {
    const [allPatients, setAllPatients] = useState<Patient[]>([]);
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoadingPatients, setIsLoadingPatients] = useState(false);
    const [isLoadingMedia, setIsLoadingMedia] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
    const [selectedFilesForBulk, setSelectedFilesForBulk] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<{ from?: Date, to?: Date }>({});
    const [activeMediaTab, setActiveMediaTab] = useState<MediaCategory | 'all'>('all');
    
    const [isSlideshowVisible, setIsSlideshowVisible] = useState(false);
    const [slideshowImages, setSlideshowImages] = useState<MediaFile[]>([]);

    // 👈 NEW: State to manage mobile view: 'list' (default/patient selection) or 'media' (gallery)
    const [mobileView, setMobileView] = useState<'list' | 'media'>('list');


    // 1. FETCH ALL PATIENTS ON MOUNT
    useEffect(() => {
        const fetchPatients = async () => {
            setIsLoadingPatients(true);
            try {
                const patientsData = await api.get<Patient[]>('/patients');
                setAllPatients(patientsData);
                
                // Keep original logic for initial selection, but set mobileView based on selection
                if (patientsData && patientsData.length > 0) {
                    setSelectedPatientId(patientsData[0].id);
                    // On desktop, immediately show media. On mobile, keep showing the list initially.
                    if (window.innerWidth >= 768) { 
                        setMobileView('media');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch patients:", error);
                const message = (error as ApiError).responseBody?.message || (error as Error).message || "Unknown error";
                toast.error(`Failed to load patient list: ${message}`);
            } finally {
                setIsLoadingPatients(false);
            }
        };

        fetchPatients();
    }, []);

    const selectedPatient = useMemo(() => allPatients.find(p => p.id === selectedPatientId) || null, [selectedPatientId, allPatients]);


    // 2. FETCH MEDIA FILES WHEN A PATIENT IS SELECTED
    useEffect(() => {
        const fetchMediaForPatient = async (patient: Patient) => {
            if (!patient.last_photo_session) {
                setMediaFiles([]);
                return;
            }

            const practiceRet: Practice = JSON.parse(localStorage.getItem('practice') || '{}');


            setIsLoadingMedia(true);
            setMediaFiles([]); // Clear media while loading new patient's files
            setSelectedFilesForBulk([]); // Clear bulk selection


            // FIX: Call the new photo-session endpoint instead of the upload endpoint
            const sessionPath = `/photo-session/${patient.last_photo_session}`;
            console.log('Fetching media from new sessionPath:', sessionPath)
            
            try {
                // Use api.get with the expected return type (MediaApiResponse)
                const response = await api.get<any>(sessionPath); // Expecting a single session object

                // The response.data is now the session object itself
                const sessionData = response.data || {};
                const mappedFiles = mapRawMedia(sessionData, patient.id);
                setMediaFiles(mappedFiles);

            } catch (error) {
                console.error(`Failed to fetch media for session ${patient.last_photo_session}:`, error);
                // Extract error message from the ApiError or generic Error
                const message = (error as ApiError).responseBody?.message || (error as Error).message || "Unknown error";
                toast.error(`Failed to load patient media: ${message}`);
            } finally {
                setIsLoadingMedia(false);
            }
        };

        if (selectedPatient) {
            fetchMediaForPatient(selectedPatient);
        } else {
            setMediaFiles([]);
        }
    }, [selectedPatient]);


    // --- FILTERING AND COMPUTED STATE (UNCHANGED) ---

    const filteredPatients = useMemo(() => {
        const filtered = allPatients.filter(p => {
            const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
            const matchesSearch = fullName.includes(searchTerm.toLowerCase());
            // Note: This logic for filtering patients by media date range relies on mediaFiles being up to date, 
            // which only happens after the selected patient's media loads.
            const hasMediaInDateRange = mediaFiles.some(m => m.patientId === p.id && 
                (!dateRange.from || m.uploadDate.getTime() >= dateRange.from!.getTime()) && 
                (!dateRange.to || m.uploadDate.getTime() <= new Date(dateRange.to!.setHours(23, 59, 59, 999)).getTime())
            );
            const matchesDateFilter = (dateRange.from || dateRange.to) ? hasMediaInDateRange : true;
            return matchesSearch && matchesDateFilter;
        });
        filtered.sort((a, b) => (b.last_photo_session ? new Date(b.last_photo_session).getTime() : 0) - (a.last_photo_session ? new Date(a.last_photo_session).getTime() : 0));
        return filtered;
    }, [allPatients, mediaFiles, searchTerm, dateRange]);

    const sortedAndFilteredMedia = useMemo(() => {
        if (!selectedPatientId) return [];
        let filtered = mediaFiles.filter(m => m.patientId === selectedPatientId);
        
        // Filter by Date Range
        if (dateRange.from) {
            filtered = filtered.filter(m => m.uploadDate.getTime() >= dateRange.from!.getTime());
        }
        if (dateRange.to) {
            const endDate = new Date(dateRange.to);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(m => m.uploadDate.getTime() <= endDate.getTime());
        }

        // Filter by Tab
        if (activeMediaTab !== 'all') {
            filtered = filtered.filter(m => m.mediaCategory === activeMediaTab);
        }

        filtered.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
        return filtered;
    }, [mediaFiles, selectedPatientId, dateRange, activeMediaTab]);


    // --- HANDLERS (ADJUSTED FOR MOBILE) ---
    const handleClearFilters = () => {
        setSearchTerm('');
        setDateRange({});
        toast.info('Patient filters cleared.');
    };

    const handleBulkDownload = () => {
      const filesToDownload = mediaFiles.filter(m => selectedFilesForBulk.includes(m.id));
      if (filesToDownload.length === 0) {
        toast.error("No files selected for download.");
        return;
      }
      filesToDownload.forEach(file => {
        // Mock download trigger: opens file URL in a new tab
        window.open(file.preview, '_blank'); 
      });
      toast.success(`${filesToDownload.length} files initiated download.`);
      setSelectedFilesForBulk([]);
    };

    const handleCreateSlideshow = () => {
      const filesForSlideshow = mediaFiles.filter(
          (m) => selectedFilesForBulk.includes(m.id) && m.fileType === 'image'
      );

      if (filesForSlideshow.length === 0) {
          toast.error("No images selected to create a slideshow.");
          return;
      }

      // Sort images by category ('before' then 'after') and then by date
      filesForSlideshow.sort((a, b) => a.mediaCategory.localeCompare(b.mediaCategory) || a.uploadDate.getTime() - b.uploadDate.getTime());

      setSlideshowImages(filesForSlideshow);
      setIsSlideshowVisible(true);
    };

    const handleSaveToPdf = async () => {
      if (!selectedPatient) {
        toast.error("A patient must be selected.");
        return;
      }

      const filesToProcess = mediaFiles.filter(
        (m) => selectedFilesForBulk.includes(m.id) && m.fileType === 'image'
      );

      if (filesToProcess.length === 0) {
        toast.error("No images selected to create a PDF.");
        return;
      }

      toast.loading("Generating PDF...", { id: 'pdf-toast' });

      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;

        doc.setFontSize(18);
        doc.text(`${selectedPatient.first_name} ${selectedPatient.last_name} - Media Report`, margin, margin + 5);
        doc.setFontSize(12);
        doc.text(`Generated on: ${formatDate(new Date(), 'PPP')}`, margin, margin + 12);

        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i];
          if (i > 0) {
            doc.addPage();
          }

          const img = new Image();
          img.crossOrigin = "Anonymous"; // Required for cross-origin images
          img.src = file.preview;

          await new Promise((resolve, reject) => {
            img.onload = () => {
              const imgWidth = img.width;
              const imgHeight = img.height;
              const ratio = Math.min((pageWidth - margin * 2) / imgWidth, (pageHeight - margin * 2) / imgHeight);
              const newWidth = imgWidth * ratio;
              const newHeight = imgHeight * ratio;
              const x = (pageWidth - newWidth) / 2;
              const y = (pageHeight - newHeight) / 2;
              doc.addImage(img, 'JPEG', x, y, newWidth, newHeight);
              resolve(true);
            };
            img.onerror = reject;
          });
        }
        doc.save(`${selectedPatient.last_name}_${selectedPatient.first_name}_Media.pdf`);
        toast.success("PDF generated successfully!", { id: 'pdf-toast' });
      } catch (error) {
        console.error("PDF Generation Error:", error);
        toast.error("Failed to generate PDF. One or more images could not be loaded.", { id: 'pdf-toast' });
      }
    };

    const toggleSelectFile = (fileId: string) => {
        setSelectedFilesForBulk(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
    };

    const toggleSelectAll = () => {
        const currentMediaIds = sortedAndFilteredMedia.map(m => m.id);
        const allSelected = selectedFilesForBulk.length === currentMediaIds.length && currentMediaIds.length > 0;
        
        // If all currently displayed are selected, deselect them. Otherwise, select all displayed.
        setSelectedFilesForBulk(allSelected ? [] : currentMediaIds);
    };

    const countMediaByCategory = useCallback((category: MediaCategory) => {
        return mediaFiles.filter(m => m.patientId === selectedPatientId && m.mediaCategory === category).length;
    }, [mediaFiles, selectedPatientId]);

    const handleUpdateMedia = (updatedFile: MediaFile) => {
        setMediaFiles(prev => prev.map(m => m.id === updatedFile.id ? updatedFile : m));
        setSelectedMedia(updatedFile); // Keep the modal updated
        toast.success("Media file details updated.");
    }
    
    // 👈 NEW: Handler to select patient and switch to media view on mobile
    const handleSelectPatient = (patientId: string) => {
        setSelectedPatientId(patientId);
        setMobileView('media'); 
    };

    // 👈 NEW: Handler for the mobile back button
    const handleBackToPatients = () => {
        setMobileView('list');
        setSelectedPatientId(null); // Clear selected patient upon returning to list
    };


    // --- RENDER (ADAPTED FOR MOBILE) ---
    return (
        // 1. Change main container to flex-col on mobile, flex-row on desktop
        <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden font-sans">
            
            {/* 1. LEFT PANEL: Patient List Sidebar / Mobile List View */}
            <div className={cn(
                "w-full md:w-80 border-r bg-white flex flex-col flex-shrink-0 h-full overflow-y-auto",
                // 2. Hide patient list when a patient is selected on mobile
                mobileView === 'media' ? 'hidden md:flex' : 'flex'
            )}>
                <div className="p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Media Library</h2>
                    <p className="text-sm text-gray-500">Select a patient below.</p>
                </div>
                
                <div className="p-4 space-y-4 flex-1"> {/* Removed overflow-y-auto, letting parent handle it */}
                    {/* Search & Date Filter (Filters now take full width on mobile) */}
                    <div className="space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input placeholder="Search patients..." value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} className="pl-10" />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {dateRange.from ? (dateRange.to ? `${formatDate(dateRange.from, "MMM d, y")} - ${formatDate(dateRange.to, "MMM d, y")}` : formatDate(dateRange.from, "MMM d, y")) : <span>Filter by date range</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent initialFocus mode="range" defaultMonth={dateRange.from} selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(range) => setDateRange(range || {})} numberOfMonths={1} />
                            </PopoverContent>
                        </Popover>
                        {(searchTerm || dateRange.from) && (
                            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="w-full text-blue-500 hover:text-blue-700">
                                <X className="h-4 w-4 mr-1" /> Clear Filters
                            </Button>
                        )}
                    </div>
                    
                    {/* Patient List */}
                    {isLoadingPatients ? (
                        <div className="flex items-center justify-center py-8 text-gray-600"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading patients...</div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="text-center text-gray-500 py-4 text-sm">No patients match filters.</div>
                    ) : (
                        <div className="space-y-1">
                            {filteredPatients.map((patient) => (
                                <div 
                                    key={patient.id} 
                                    className={`p-3 rounded-lg cursor-pointer transition-all border-l-4 hover:bg-gray-100 ${selectedPatientId === patient.id && mobileView === 'media' ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`} 
                                    onClick={() => handleSelectPatient(patient.id)}
                                >
                                    <h4 className="font-medium text-base truncate">{patient.first_name} {patient.last_name}</h4> {/* Increased text size for mobile touch targets */}
                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-0.5">
                                        <span className="truncate">{patient.procedure_type || 'N/A'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. CENTRAL PANEL: Patient Header & Media Gallery */}
            <div className={cn(
                "flex-1 flex flex-col overflow-auto w-full",
                // 3. Hide media gallery when list is visible on mobile
                mobileView === 'list' ? 'hidden md:flex' : 'flex'
            )}>
                {/* Patient Info Header */}
                <header className="sticky top-0 z-10 p-4 md:p-6 bg-white border-b shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center min-h-[50px]">
                        {selectedPatient ? (
                            // Add back button for mobile
                            <div className="flex items-center w-full"> 
                                {mobileView === 'media' && (
                                    <Button variant="ghost" size="sm" onClick={handleBackToPatients} className="mr-2 p-1 h-auto flex md:hidden">
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                )}
                                <div className="flex flex-col">
                                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">{selectedPatient.first_name} {selectedPatient.last_name}</h1>
                                    {/* Compact details for mobile, expanding for desktop */}
                                    <div className="flex flex-wrap space-x-2 md:space-x-3 mt-0.5 md:mt-1 text-xs md:text-sm text-gray-600">
                                        <span className="font-medium">{selectedPatient.procedure_type || 'N/A'}</span>
                                        <span className="hidden md:inline">•</span>
                                        <span className="hidden md:inline">{selectedPatient.email}</span>
                                        <span className="hidden md:inline">•</span>
                                        <span className="hidden md:inline">{selectedPatient.phone}</span> 
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center text-gray-500">
                                <CheckCircle className="h-6 w-6 mr-3 text-gray-400" />
                                <h1 className="text-xl md:text-2xl font-semibold">Select a Patient</h1>
                            </div>
                        )}
                    </div>
                </header>

                {/* Media Gallery */}
                <main className="p-4 md:p-6 flex-1"> {/* Reduced padding for mobile */}
                    {selectedPatient ? (
                        isLoadingMedia ? (
                            <div className="flex items-center justify-center py-16 text-gray-600 border-2 border-dashed rounded-xl h-full">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />Loading media for {selectedPatient.first_name}...
                            </div>
                        ) : (
                            <Tabs value={activeMediaTab} onValueChange={(value: any) => setActiveMediaTab(value as MediaCategory | 'all')} className="w-full">
                                
                                {/* Select All & Bulk Actions BAR */}
                                <div className="mb-4">
                                    {selectedFilesForBulk.length > 0 ? (
                                        <div className="flex flex-col space-y-2 md:flex-row items-start md:items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-md">
                                            <span className="text-sm font-semibold text-blue-700">{selectedFilesForBulk.length} files selected</span>
                                            <div className="flex space-x-3">
                                                <Button size="sm" variant="secondary" onClick={() => setSelectedFilesForBulk([])}><X className="h-4 w-4 mr-1" />Clear</Button> {/* Shorten button text */}
                                                <Button size="sm" onClick={handleBulkDownload}><Download className="h-4 w-4 mr-1" />Download</Button> {/* Shorten button text */}
                                                <Button size="sm" variant="outline" onClick={handleSaveToPdf}>
                                                  <FileText className="h-4 w-4 mr-1" /> Save to PDF
                                                </Button>
                                                <Button size="sm" variant="default" onClick={handleCreateSlideshow} className="bg-green-600 hover:bg-green-700">
                                                  <Play className="h-4 w-4 mr-1" /> Slideshow
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2 p-3 bg-white border rounded-lg shadow-sm w-full md:w-fit"> {/* Full width on mobile */}
                                            <Checkbox 
                                                id="select-all" 
                                                checked={sortedAndFilteredMedia.length > 0 && selectedFilesForBulk.length === sortedAndFilteredMedia.length} 
                                                onCheckedChange={toggleSelectAll} 
                                            />
                                            <Label htmlFor="select-all" className="text-sm font-medium text-gray-700">Select All (Filtered)</Label>
                                        </div>
                                    )}
                                </div>


                                {/* Tabs List (Enable horizontal scroll for small screens) */}
                                <div className="flex justify-between items-center mb-4 md:mb-6 overflow-x-auto">
                                    <TabsList className="flex-shrink-0">
                                        <TabsTrigger value="all" className="text-sm whitespace-nowrap">All ({sortedAndFilteredMedia.length})</TabsTrigger>
                                        <TabsTrigger value="before" className="text-sm whitespace-nowrap">Before ({countMediaByCategory('before')})</TabsTrigger>
                                        <TabsTrigger value="after" className="text-sm whitespace-nowrap">After ({countMediaByCategory('after')})</TabsTrigger>
                                        <TabsTrigger value="other" className="text-sm whitespace-nowrap">Other ({countMediaByCategory('other')})</TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* Media Grid (TabsContent) */}
                                <TabsContent value={activeMediaTab}>
                                    {/* 4. Reduced grid columns for mobile (2 columns) */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"> 
                                        {sortedAndFilteredMedia.length > 0 ? (
                                            sortedAndFilteredMedia.map(file => (
                                                <RawMediaCard
                                                    key={file.id}
                                                    file={file}
                                                    patientName={`${selectedPatient?.first_name || ''} ${selectedPatient?.last_name || ''}`}
                                                    onViewDetails={setSelectedMedia}
                                                    selectable={true}
                                                    isSelected={selectedFilesForBulk.includes(file.id)}
                                                    onSelect={toggleSelectFile}
                                                />
                                            ))
                                        ) : (
                                            <div className="col-span-full text-center text-gray-500 py-12 border-2 border-dashed rounded-lg">
                                                <AlertCircle className="h-8 w-8 mx-auto mb-3" />
                                                <p className="text-lg">No {activeMediaTab === 'all' ? '' : `${activeMediaTab} `}media found.</p>
                                                <p className="text-sm">Try clearing date filters or selecting another patient.</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-100 border-2 border-dashed rounded-xl">
                            <div className="text-center text-gray-500 p-8">
                                <Eye className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                                <p className="text-xl font-medium">Media Gallery Empty</p>
                                <p className="text-md mt-2">Use the patient list to load a patient's media files.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Media Details Modal (Adjusted size for mobile) */}
            {selectedMedia && (
                <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
                    <DialogContent className="max-w-xs md:max-w-4xl max-h-[95vh] overflow-y-auto"> {/* Reduced max-width */}
                        <DialogHeader>
                            <DialogTitle className="text-xl md:text-2xl">{selectedMedia.fileName}</DialogTitle> {/* Smaller title */}
                            <DialogDescription className="text-sm">Details for this media file from **{selectedPatient?.first_name} {selectedPatient?.last_name}**</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4"> {/* Reduced gap */}
                            <div className="relative rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center p-2">
                                <img src={selectedMedia.preview} alt={selectedMedia.fileName} className="w-full h-auto max-h-[40vh] md:max-h-[50vh] object-contain rounded-md" /> {/* Reduced max-height */}
                            </div>
                            <div className="space-y-3"> {/* Reduced vertical spacing */}
                                <Badge className={`text-sm font-medium py-1 px-3 ${selectedMedia.mediaStatus === 'uploaded' ? 'bg-purple-100 text-purple-800' : selectedMedia.mediaStatus === 'pending_editing' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>Status: {selectedMedia.mediaStatus.replace(/_/g, ' ')}</Badge>
                                
                                <div className="space-y-1">
                                    <Label htmlFor="mediaCategory" className="text-sm">Category</Label>
                                    <Select 
                                        value={selectedMedia.mediaCategory} 
                                        onValueChange={(value: MediaCategory) => handleUpdateMedia({ ...selectedMedia, mediaCategory: value })}
                                    >
                                        <SelectTrigger id="mediaCategory" className="h-9 text-sm"><SelectValue placeholder="Select Category" /></SelectTrigger> {/* Reduced trigger height */}
                                        <SelectContent>
                                            <SelectItem value="before">Before Photos</SelectItem>
                                            <SelectItem value="after">After Photos</SelectItem>
                                            <SelectItem value="other">Other Media</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-1">
                                    <Label htmlFor="assistantNotes" className="text-sm">Dental Assistant Notes</Label>
                                    <Textarea 
                                        id="assistantNotes" 
                                        placeholder="Add notes for this image..." 
                                        value={selectedMedia.dentalAssistantNotes || ''} 
                                        onChange={(e) => setSelectedMedia(prev => prev ? { ...prev, dentalAssistantNotes: e.target.value } : null)} 
                                        rows={3} 
                                        className="text-sm"
                                    />
                                    <Button 
                                        onClick={() => handleUpdateMedia(selectedMedia)}
                                        size="sm"
                                        className="w-full"
                                    >
                                        Save Notes
                                    </Button>
                                </div>
                                
                                <div className="pt-2">
                                    <Button className="w-full text-base py-4" onClick={() => window.open(selectedMedia.preview, '_blank')}><Download className="h-4 w-4 mr-2" /> Download File</Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Slideshow Modal */}
            {isSlideshowVisible && (
                <Slideshow 
                    images={slideshowImages} 
                    isOpen={isSlideshowVisible} 
                    onClose={() => setIsSlideshowVisible(false)} 
                />
            )}
        </div>
    );
}

// --- NEW: Slideshow Component ---
const Slideshow = ({ images, isOpen, onClose }: { images: MediaFile[], isOpen: boolean, onClose: () => void }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingTool, setDrawingTool] = useState<'pencil' | 'eraser' | 'hand'>('pencil');
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const imageRef = React.useRef<HTMLImageElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentIndex]);

    useEffect(() => {
        if (isPlaying && isOpen) {
            const timer = setTimeout(() => {
                nextSlide();
            }, 3000); // Change slide every 3 seconds
            return () => clearTimeout(timer);
        }
    }, [currentIndex, isPlaying, isOpen]);

    const nextSlide = () => {
        setCurrentIndex(prev => (prev + 1) % images.length);
        clearCanvas();
        resetZoom();
    };

    const prevSlide = () => {
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
        clearCanvas();
        resetZoom();
    };

    const resetZoom = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev * 1.5, 5));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev / 1.5, 0.5));
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 5));
    };

    const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (drawingTool !== 'hand' && zoom <= 1) return;
        e.preventDefault();
        setIsPanning(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setLastPanPoint({ x: clientX, y: clientY });
    };

    const handlePanMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isPanning || !lastPanPoint) return;
        if (drawingTool !== 'hand' && zoom <= 1) return;
        e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const deltaX = clientX - lastPanPoint.x;
        const deltaY = clientY - lastPanPoint.y;
        setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        setLastPanPoint({ x: clientX, y: clientY });
    };

    const handlePanEnd = () => {
        setIsPanning(false);
        setLastPanPoint(null);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const setupCanvas = () => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (canvas && image) {
            const rect = image.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            canvas.style.left = `${rect.left}px`;
            canvas.style.top = `${rect.top}px`;
        }
    };

    const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (drawingTool === 'hand') {
            handlePanStart(e);
            return;
        }
        e.preventDefault();
        setIsDrawing(true);
        const point = getCanvasPoint(e);
        setLastPoint(point);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (drawingTool === 'hand') {
            handlePanMove(e);
            return;
        }
        e.preventDefault();
        if (!isDrawing || !lastPoint) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        
        const currentPoint = getCanvasPoint(e);
        if (!currentPoint) return;
        
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        
        if (drawingTool === 'pencil') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
        } else {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = 20;
        }
        
        ctx.lineCap = 'round';
        ctx.stroke();
        
        setLastPoint(currentPoint);
    };

    const stopDrawing = () => {
        if (drawingTool === 'hand') {
            handlePanEnd();
            return;
        }
        setIsDrawing(false);
        setLastPoint(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                ref={containerRef}
                className="relative w-full h-full flex items-center justify-center overflow-hidden" 
                onClick={e => e.stopPropagation()}
                onWheel={handleWheel}
            >
                <img 
                    ref={imageRef}
                    src={images[currentIndex].preview} 
                    alt={images[currentIndex].fileName} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in fade-in-50 select-none"
                    style={{
                        transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                        cursor: drawingTool === 'hand' ? (isPanning ? 'grabbing' : 'grab') : 
                               zoom > 1 && drawingTool !== 'pencil' && drawingTool !== 'eraser' ? 'grab' : 'default'
                    }}
                    onLoad={setupCanvas}
                    onMouseDown={handlePanStart}
                    onMouseMove={handlePanMove}
                    onMouseUp={handlePanEnd}
                    onMouseLeave={handlePanEnd}
                    onTouchStart={handlePanStart}
                    onTouchMove={handlePanMove}
                    onTouchEnd={handlePanEnd}
                    draggable={false}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute pointer-events-auto"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                <Button onClick={onClose} variant="destructive" size="icon" className="absolute top-4 right-4 rounded-full h-10 w-10"><X className="h-5 w-5" /></Button>
                <Button onClick={prevSlide} variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 opacity-70 hover:opacity-100"><ChevronLeft className="h-6 w-6" /></Button>
                <Button onClick={nextSlide} variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 opacity-70 hover:opacity-100"><ChevronRight className="h-6 w-6" /></Button>
                
                {/* Drawing Tools */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Button 
                        onClick={() => setDrawingTool('pencil')} 
                        variant={drawingTool === 'pencil' ? 'default' : 'secondary'} 
                        size="icon" 
                        className="rounded-full h-10 w-10"
                    >
                        ✏️
                    </Button>
                    <Button 
                        onClick={() => setDrawingTool('eraser')} 
                        variant={drawingTool === 'eraser' ? 'default' : 'secondary'} 
                        size="icon" 
                        className="rounded-full h-10 w-10"
                    >
                        🧹
                    </Button>
                    <Button 
                        onClick={() => setDrawingTool('hand')} 
                        variant={drawingTool === 'hand' ? 'default' : 'secondary'} 
                        size="icon" 
                        className="rounded-full h-10 w-10"
                        title="Hand Tool - Pan Image"
                    >
                        ✋
                    </Button>
                    <Button 
                        onClick={clearCanvas} 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full h-10 w-10 text-white border-white hover:bg-white/20"
                    >
                        🗑️
                    </Button>
                </div>
                
                {/* Zoom Controls */}
                <div className="absolute top-4 right-16 flex flex-col gap-2">
                    <Button 
                        onClick={handleZoomIn} 
                        variant="default" 
                        size="icon" 
                        className="rounded-full h-14 w-14 bg-white text-black hover:bg-gray-100 text-2xl font-black shadow-lg border-2 border-gray-300"
                    >
                        +
                    </Button>
                    <Button 
                        onClick={handleZoomOut} 
                        variant="default" 
                        size="icon" 
                        className="rounded-full h-14 w-14 bg-white text-black hover:bg-gray-100 text-2xl font-black shadow-lg border-2 border-gray-300"
                    >
                        −
                    </Button>
                    <Button 
                        onClick={resetZoom} 
                        variant="default" 
                        size="icon" 
                        className="rounded-full h-14 w-14 bg-white text-black hover:bg-gray-100 text-xl font-bold shadow-lg border-2 border-gray-300"
                        title="Reset Zoom"
                    >
                        ⌂
                    </Button>
                </div>
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 p-2 rounded-full">
                    <Button onClick={() => setIsPlaying(!isPlaying)} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                    <p className="text-white text-sm font-medium">{currentIndex + 1} / {images.length}</p>
                </div>
            </div>
        </div>
    );
};