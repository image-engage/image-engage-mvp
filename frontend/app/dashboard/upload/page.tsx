'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import {
    Upload,
    X,
    Image,
    Search,
    CheckCircle,
    AlertCircle,
    FolderOpen,
    Camera,
    Video,
    Loader2,
    FileText,
    Calendar,
} from 'lucide-react';

// Assuming you have a reusable API client for consistency
import { api, ApiError } from '@/components/lib/api';

// --- Interfaces ---

interface UploadFile {
    id: string;
    file: File;
    preview: string;
    patientPhotoId?: string;
    category: 'before' | 'after' | 'other';
    type: 'image' | 'video';
}

interface PatientConsent {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    last_photo_session: string | null;
}

interface FolderStructure {
    practiceId: string;
    practiceName: string;
    folders: {
        consents: string;
        rawPhotos: string;
        editedPhotos: string;
        collagesReview: string;
        publishedArchive: string;
        beforePhotos: string;
        afterPhotos: string;
        otherMedia: string;
    };
}

interface ApiResponse {
  uploadedFilesCount: number;
  data: {
    photosCount: number;
    uploadedFilesCount: number;
  };
}

// --- Component ---

export default function MediaUploadPage() {
    // State to manage patient data and selection
    const [patients, setPatients] = useState<PatientConsent[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientConsent | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoadingPatients, setIsLoadingPatients] = useState(true);
    const [patientFetchError, setPatientFetchError] = useState<string | null>(null);

    // State to manage files and upload process
    const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

    // Fixed folder structure for the practice
    const [folderStructure] = useState<FolderStructure>({
        practiceId: 'DENT001',
        practiceName: 'Smile Dental Clinic',
        folders: {
            consents: '/DENT001/_Consents/',
            rawPhotos: '/DENT001/_RawPhotos/',
            editedPhotos: '/DENT001/_EditedPhotos/',
            collagesReview: '/DENT001/_CollagesReadyForReview/',
            publishedArchive: '/DENT001/_PublishedArchive/',
            beforePhotos: '/DENT001/_RawPhotos/Before/',
            afterPhotos: '/DENT001/_RawPhotos/After/',
            otherMedia: '/DENT001/_RawPhotos/Other/',
        }
    });

    // --- Data Fetching Effect (Calls patient.controller) ---
    // This effect fetches patient data based on the search term.
    useEffect(() => {
        const fetchPatients = async () => {
            setIsLoadingPatients(true);
            setPatientFetchError(null);
            try {
                // Fetch patients from the API with the current search term
                const response = await api.get<PatientConsent[]>(`/patients?search=${encodeURIComponent(searchTerm)}`);

                if (Array.isArray(response)) {
                    setPatients(response);
                    // Automatically select the first patient if one exists and no patient is currently selected
                    if (response.length > 0 && !selectedPatient) {
                        setSelectedPatient(response[0]);
                    }
                } else {
                    console.error('API response is not a valid array:', response);
                    throw new Error('Invalid data format received from the server.');
                }
            } catch (error: any) {
                console.error('Error fetching patients:', error);
                setPatientFetchError(error.message || 'Failed to load patient data.');
                toast.error(`Error: ${error.message || 'Failed to load patients.'}`);
            } finally {
                setIsLoadingPatients(false);
            }
        };
        fetchPatients();
    }, [searchTerm]); // Only re-run when the search term changes

    // Effect to clear staged files when a different patient is selected
    // This ensures that when you switch to a new patient, the file staging area is cleared.
    // The `patientPhotoId` will be regenerated based on the new `selectedPatient`
    // when new files are added.
    useEffect(() => {
        // Revoke object URLs for existing previews to prevent memory leaks
        uploadedFiles.forEach(file => {
            if (file.type === 'image' && file.preview) {
                URL.revokeObjectURL(file.preview);
            }
        });
        setUploadedFiles([]);
        setDroppedFiles([]); // Also clear any dropped files that might be staged for a previous patient
    }, [selectedPatient]); // Depend on selectedPatient


    // Callback to generate a unique ID for a photo session.
    const generatePatientPhotoId = useCallback((patient: PatientConsent): string => {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const sessionCounter = Math.random().toString(36).substring(2, 5); // Generate a short random string
        return `${patient.last_name}_${dateStr}_${sessionCounter}`;
    }, []);

    // Callback to process files from either drag-and-drop or file selection.
    const handleFiles = useCallback((files: File[]) => {
        if (!selectedPatient) {
            toast.error('Please select a patient first.');
            return;
        }

        // Generate a single patientPhotoId for the entire session.
        // Since uploadedFiles are cleared on selectedPatient change, this will always
        // generate a new ID for the first file added to a new patient's session.
        const patientPhotoId = uploadedFiles.length > 0
            ? uploadedFiles[0].patientPhotoId // Reuse existing ID if files are already staged for this session
            : generatePatientPhotoId(selectedPatient); // Generate a new ID for a new session


        const newFiles: UploadFile[] = files.map(file => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            let fileType: 'image' | 'video' | null = null;
            let filePreview: string | null = null;

            if (isImage) {
                fileType = 'image';
                filePreview = URL.createObjectURL(file);
            } else if (isVideo) {
                fileType = 'video';
                filePreview = '/video-placeholder.png'; // Use a placeholder image for video previews
            } else {
                return null;
            }

            if (!fileType || !filePreview) return null;

            return {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                file,
                preview: filePreview,
                patientPhotoId,
                category: 'other', // Default category
                type: fileType,
            };
        }).filter(Boolean) as UploadFile[];

        // Handle unsupported files
        if (newFiles.length !== files.length) {
            toast.warning('Some unsupported file types were skipped (only images and videos are supported).');
        }

        // Update the list of uploaded files
        setUploadedFiles(prev => [...prev, ...newFiles]);
        if (newFiles.length > 0) {
            toast.success(`Patient Photo ID for this session: ${patientPhotoId}`);
        }
    }, [selectedPatient, generatePatientPhotoId, uploadedFiles]);

    // Use a separate effect to handle files dropped before a patient is selected.
    useEffect(() => {
        if (selectedPatient && droppedFiles.length > 0) {
            handleFiles(droppedFiles);
            setDroppedFiles([]); // Clear the staged files after processing
        }
    }, [selectedPatient, droppedFiles, handleFiles]);

    // Drag-and-drop event handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);

        if (selectedPatient) {
            handleFiles(files);
        } else {
            setDroppedFiles(files); // Stage files until a patient is selected
            toast.info('Files staged. Please select a patient to continue.');
        }
    }, [selectedPatient, handleFiles]);

    // File input change handler
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (selectedPatient) {
                handleFiles(files);
            } else {
                setDroppedFiles(files);
                toast.info('Files staged. Please select a patient to continue.');
            }
            // Clear the input value so the same file can be selected again
            e.target.value = '';
        }
    };

    // Callback to remove a file and revoke its object URL to prevent memory leaks.
    const removeFile = (id: string) => {
        setUploadedFiles(prev => {
            const fileToRemove = prev.find(f => f.id === id);
            if (fileToRemove && fileToRemove.type === 'image' && fileToRemove.preview) {
                URL.revokeObjectURL(fileToRemove.preview);
            }
            return prev.filter(f => f.id !== id);
        });
    };

    // Callback to change the category of an uploaded file.
    const handleCategoryChange = (id: string, category: 'before' | 'after' | 'other') => {
        setUploadedFiles(prev =>
            prev.map(file =>
                file.id === id ? { ...file, category } : file
            )
        );
    };

    // Function to get the dynamic upload path based on category and patient ID
    const getUploadPath = useCallback((category: 'before' | 'after' | 'other', patientPhotoId: string): string => {
        switch (category) {
            case 'before':
                return `${folderStructure.folders.beforePhotos}${patientPhotoId}/`;
            case 'after':
                return `${folderStructure.folders.afterPhotos}${patientPhotoId}/`;
            case 'other':
            default:
                return `${folderStructure.folders.otherMedia}${patientPhotoId}/`;
        }
    }, [folderStructure]);


    // --- Main Upload Logic (Calls photo-session.controller) ---
    const handleUpload = async () => {
        if (!selectedPatient) {
            toast.error('Please select a patient');
            return;
        }

        if (uploadedFiles.length === 0) {
            toast.error('Please select files to upload');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();

            // Append session-level metadata
            formData.append('practiceId', 'DENT001'); // Assuming practiceId is fixed or derived elsewhere
            formData.append('patientId', selectedPatient.id);
            const sessionPatientPhotoId = uploadedFiles[0]?.patientPhotoId || generatePatientPhotoId(selectedPatient);
            formData.append('patientPhotoId', sessionPatientPhotoId);

            // Append each file and its category
            uploadedFiles.forEach((fileItem) => {
                formData.append('mediaFiles', fileItem.file, fileItem.file.name);
                formData.append('categories', fileItem.category); // Send categories as an array
            });

            // Use the new api.postFormData method for FormData uploads
                const result: ApiResponse = await api.postFormData(
                '/photo-session/upload-photos', // Endpoint
                formData // FormData object
                );

            console.log('Upload success:', result);

            toast.success(`Successfully uploaded ${result.data?.photosCount || result.uploadedFilesCount} files for ${selectedPatient.first_name} ${selectedPatient.last_name}`);

            // Clean up state and object URLs after a successful upload
            uploadedFiles.forEach(file => {
                if (file.type === 'image' && file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
            setUploadedFiles([]);
            setSelectedPatient(null);
            setSearchTerm('');

        } catch (error: any) {
            console.error('Frontend upload error:', error);
            toast.error(`Upload failed: ${error.message || 'Please try again.'}`);
        } finally {
            setIsUploading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-3">
                        <Camera className="h-8 w-8 text-blue-600" />
                        <h1 className="text-4xl font-bold text-gray-900">Patient Media Upload</h1>
                    </div>
                    <p className="text-gray-600 text-lg">Upload patient photos and videos with automatic organization</p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                        <FolderOpen className="h-4 w-4" />
                        <span>Practice: {folderStructure.practiceName}</span>
                        <span>•</span>
                        <span>ID: {folderStructure.practiceId}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="shadow-lg border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <span className="h-5 w-5 text-blue-600">👤</span>
                                <span>Select Patient</span>
                            </CardTitle>
                            <CardDescription>Search and select a patient</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search patients..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {isLoadingPatients ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                                    <span className="text-gray-600">Loading patients...</span>
                                </div>
                            ) : patientFetchError ? (
                                <div className="text-center py-8 text-red-600">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                    <p>{patientFetchError}</p>
                                    <p className="text-sm text-gray-500">Please check your API server.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                    {patients.length === 0 ? (
                                        <div className="text-center text-gray-500 py-4">No patients found.</div>
                                    ) : (
                                        patients.map((patient) => (
                                            <div
                                                key={patient.id}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                                    selectedPatient?.id === patient.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => {
                                                    // FIX: Toggle selection and clear files immediately
                                                    if (selectedPatient && selectedPatient.id === patient.id) {
                                                        setSelectedPatient(null); // Deselect if already selected
                                                    } else {
                                                        setSelectedPatient(patient); // Select new patient
                                                    }
                                                    // Clear uploaded files and dropped files immediately on patient change
                                                    setUploadedFiles([]);
                                                    setDroppedFiles([]);
                                                }}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-gray-900">
                                                        {patient.first_name} {patient.last_name}
                                                    </h4>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">{patient.email}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0">
                        <CardHeader>
                            <CardTitle className="text-lg">Patient Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {selectedPatient ? (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-500">Name:</span>
                                            <span className="text-sm font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-500">Email:</span>
                                            <span className="text-sm">{selectedPatient.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-500">Last Session:</span>
                                            <span className="text-sm">
                                                {selectedPatient.last_photo_session
                                                    ? new Date(selectedPatient.last_photo_session).toLocaleDateString()
                                                    : 'N/A'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <CheckCircle className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-800">Ready for Media Session</span>
                                        </div>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Patient Photo ID will be generated: {selectedPatient.last_name}_{new Date().toISOString().slice(0, 10).replace(/-/g, '')}_XXX
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="p-4 text-center text-gray-500">
                                    {isLoadingPatients ? 'Loading patient details...' : 'Select a patient to view details.'}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-6">
                        <Card className="shadow-lg border-0">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Upload className="h-5 w-5 text-blue-600" />
                                    <span>Upload Patient Media</span>
                                </CardTitle>
                                <CardDescription>
                                    {selectedPatient
                                        ? `Upload photos or videos for ${selectedPatient.first_name} ${selectedPatient.last_name}`
                                        : 'Select a patient to begin uploading media'
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                                        isDragOver
                                            ? 'border-blue-500 bg-blue-50 scale-105'
                                            : selectedPatient
                                                ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                                : 'border-gray-200 bg-gray-50'
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className="flex items-center justify-center space-x-4 mb-4">
                                        <Camera className={`h-16 w-16 ${selectedPatient ? 'text-blue-500' : 'text-gray-300'}`} />
                                        <Video className={`h-16 w-16 ${selectedPatient ? 'text-blue-500' : 'text-gray-300'}`} />
                                    </div>
                                    <p className={`text-xl font-medium mb-3 ${selectedPatient ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {selectedPatient ? 'Drop files here or click to upload' : 'Select a patient first'}
                                    </p>
                                    <p className={`text-sm mb-6 ${selectedPatient ? 'text-gray-600' : 'text-gray-400'}`}>
                                        Supports JPG, PNG, HEIC, MP4, MOV files (Max 500MB per file)
                                    </p>
                                    <label
                                        htmlFor="media-upload"
                                        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 cursor-pointer
                                        bg-blue-600 text-white hover:bg-blue-700
                                        ${!selectedPatient ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Image className="h-4 w-4 mr-2" />
                                        Select Media Files
                                        <input
                                            id="media-upload"
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            disabled={!selectedPatient}
                                        />
                                    </label>
                                </div>

                                {uploadedFiles.length > 0 && (
                                    <div className="mt-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-medium text-gray-900">
                                                Staged Files ({uploadedFiles.length})
                                            </h4>
                                            {uploadedFiles[0]?.patientPhotoId && (
                                                <Badge variant="outline" className="text-blue-700 border-blue-200">
                                                    ID: {uploadedFiles[0].patientPhotoId}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {uploadedFiles.map((file) => (
                                                <Card key={file.id} className="relative group">
                                                    <CardContent className="p-4">
                                                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-md mb-3 flex items-center justify-center">
                                                            {file.type === 'image' ? (
                                                                <img
                                                                    src={file.preview}
                                                                    alt={file.file.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <Video className="h-12 w-12 text-gray-400" />
                                                            )}
                                                            <button
                                                                onClick={() => removeFile(file.id)}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-sm font-medium text-gray-700 truncate mr-2">
                                                                {file.file.name}
                                                            </p>
                                                            <Badge variant="secondary" className="whitespace-nowrap">
                                                                {file.type === 'image' ? 'Image' : 'Video'}
                                                            </Badge>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`category-${file.id}`} className="text-xs font-medium text-gray-500">
                                                                Category
                                                            </Label>
                                                            <Select
                                                                value={file.category}
                                                                onValueChange={(value: 'before' | 'after' | 'other') => handleCategoryChange(file.id, value)}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select Category" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="before">Before Photos</SelectItem>
                                                                    <SelectItem value="after">After Photos</SelectItem>
                                                                    <SelectItem value="other">Other Media</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedPatient && uploadedFiles[0]?.patientPhotoId && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-xs font-medium text-blue-800 mb-1">Example Upload Path (dynamic based on category):</p>
                                        <p className="text-xs text-blue-700 font-mono break-all">
                                            {getUploadPath(uploadedFiles[0].category, uploadedFiles[0].patientPhotoId)}
                                            {uploadedFiles[0].file.name ? `${uploadedFiles[0].file.name}` : '[File Name]'}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <div className="flex justify-between items-center mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    uploadedFiles.forEach(file => {
                                        if (file.type === 'image' && file.preview) {
                                            URL.revokeObjectURL(file.preview);
                                        }
                                    });
                                    setUploadedFiles([]);
                                }}
                                disabled={isUploading || uploadedFiles.length === 0}
                            >
                                Clear All
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={!selectedPatient || uploadedFiles.length === 0 || isUploading}
                                className="w-full md:w-auto px-10 py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-5 w-5 mr-2" />
                                        Start Upload
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="xl:col-span-1 space-y-6">
                        <Card className="shadow-lg border-0">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <FolderOpen className="h-5 w-5 text-blue-600" />
                                    <span>Folder Structure</span>
                                </CardTitle>
                                <CardDescription>Files will be organized in Supabase Storage</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm space-y-2">
                                    <div className="font-medium text-gray-900 mb-3">EmageSmileAI - {folderStructure.practiceName}</div>
                                    <div className="space-y-1 ml-4">
                                        <div className="text-gray-600">📁 _Consents/</div>
                                        <div className="text-gray-600">📁 _RawPhotos/</div>
                                        <div className="ml-4 text-gray-600">📁 Before/ ← Before photos/videos</div>
                                        <div className="ml-4 text-gray-600">📁 After/ ← After photos/videos</div>
                                        <div className="ml-4 text-gray-600">📁 Other/ ← Other photos/videos</div>
                                        <div className="text-gray-600">📁 _EditedPhotos/</div>
                                        <div className="text-gray-600">📁 _CollagesReadyForReview/</div>
                                        <div className="text-gray-600">📁 _PublishedArchive/</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-0">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <FileText className="h-5 w-5 text-green-600" />
                                    <span>Upload Guidelines</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-gray-600">
                                <div className="space-y-3">
                                    <div className="flex items-start space-x-3">
                                        <Camera className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-900">High-Quality Media</p>
                                            <p className="text-xs text-gray-500">Use good lighting and clear focus for photos, clear audio for videos</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <Image className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-900">Supported Formats</p>
                                            <p className="text-xs text-gray-500">Images: JPG, PNG, HEIC. Videos: MP4, MOV (up to 500MB each)</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <Calendar className="h-4 w-4 mt-0.5 text-orange-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-900">Auto-Generated ID</p>
                                            <p className="text-xs text-gray-500">PatientLastName_YYYYMMDD_XXX</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <FolderOpen className="h-4 w-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-900">Categorize Files</p>
                                            <p className="text-xs text-gray-500">Assign "Before", "After", or "Other" categories to organize files</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
