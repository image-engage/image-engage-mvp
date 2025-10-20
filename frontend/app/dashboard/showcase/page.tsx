'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, MessageSquare, Tag, EyeOff, Hand, Star, Download, Eye, Calendar, Share2, Copy, Clock, Image, Video } from "lucide-react";
import { cn } from "@/components/lib/utils";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';


// Define the types for your data structures
interface PatientConsent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  procedureType: string;
  consentDate: string;
}

// New Media statuses for the raw processing pipeline
type RawMediaStatus = 'new_upload' | 'categorized' | 'pending_processing' | 'processing_in_progress' | 'processed';
type AIQualityRating = 'excellent' | 'good' | 'fair' | 'poor';
type PatientConsentLevel = 'public_showcase' | 'private_practice_only' | 'no_use';

interface MediaFile {
  id: string;
  patientConsentId: string;
  fileName: string;
  fileType: 'image' | 'video';
  mediaCategory: 'before' | 'after' | 'other';
  fileSize: number;
  uploadDate: string;
  preview: string;
  rawStatus: RawMediaStatus;
  dentalAssistantNotes?: string;
  isShowcaseReady?: boolean;
  showcaseNotes?: string;
  editedBy?: string;
  editedAt?: string;

  // --- New AI-powered fields ---
  aiAnalysis?: {
    qualityRating: AIQualityRating;
    suggestedTags: string[];
    privacyRisks: {
      hasPatientInfo: boolean;
      hasBlurredFaces: boolean;
      exposedInfoDetails?: string[];
    };
    isDuplicate: boolean;
  };

  // --- New fields for consent and workflow ---
  patientConsentLevel?: PatientConsentLevel;
  workflowSteps?: string[];
}


// RawMediaCard Component
interface RawMediaCardProps {
  file: MediaFile;
  patients: PatientConsent[];
  selectable?: boolean;
  onSelect?: (id: string) => void;
  onCategorize?: (id: string, category: 'before' | 'after' | 'other', notes?: string) => void;
  onSendForProcessing?: (mediaIds: string[]) => void;
  onViewDetails: (file: MediaFile) => void;
  isSelected?: boolean;
  onDownloadForProcessing: (fileId: string) => void;
}

const RawMediaCard = ({
  file,
  patients,
  selectable = false,
  onSelect,
  onCategorize,
  onSendForProcessing,
  onViewDetails,
  isSelected,
  onDownloadForProcessing
}: RawMediaCardProps) => (
  <Card
    key={file.id}
    className={`overflow-hidden relative group hover:shadow-lg transition-all duration-200 ${
      selectable && isSelected
        ? 'ring-2 ring-blue-500 shadow-lg'
        : ''
    }`}
  >
    <div className="aspect-square bg-gray-100 relative">
      {file.fileType === 'image' ? (
        <img
          src={file.preview}
          alt={file.fileName}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <Video className="h-10 w-10 text-white" />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white bg-opacity-20 rounded-full p-2">
              <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent ml-1"></div>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Badges */}
      {file.aiAnalysis && (
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {file.aiAnalysis.privacyRisks.hasPatientInfo && (
            <Badge variant="destructive" className="text-xs">
              <EyeOff className="h-3 w-3 mr-1" /> Privacy Risk
            </Badge>
          )}
          {file.aiAnalysis.privacyRisks.hasBlurredFaces && (
            <Badge variant="destructive" className="text-xs">
              <EyeOff className="h-3 w-3 mr-1" /> Faces Blurred
            </Badge>
          )}
          {file.aiAnalysis.isDuplicate && (
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              <Copy className="h-3 w-3 mr-1" /> Duplicate
            </Badge>
          )}
        </div>
      )}

      <div className="absolute top-2 right-2 flex space-x-1">
        <Badge variant="secondary" className="text-xs">
          {file.fileType === 'image' ? 'Image' : 'Video'}
        </Badge>
        <Badge className={`text-xs ${
          file.rawStatus === 'new_upload' ? 'bg-purple-100 text-purple-800' :
          file.rawStatus === 'categorized' ? 'bg-orange-100 text-orange-800' :
          file.rawStatus === 'pending_processing' ? 'bg-blue-100 text-blue-800' :
          file.rawStatus === 'processing_in_progress' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {file.rawStatus.replace(/_/g, ' ')}
        </Badge>
      </div>
      {selectable && (
        <div className="absolute top-2 left-2">
          <Input
            type="checkbox"
            className="h-5 w-5 border-2 border-blue-500 text-blue-600 focus:ring-blue-500 rounded"
            checked={isSelected}
            onChange={() => onSelect?.(file.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
       {file.dentalAssistantNotes && (
        <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <MessageSquare size={12} /> <span className="truncate">Notes added</span>
        </div>
      )}
    </div>
    <CardContent className="p-3">
      <p className="text-sm font-medium truncate">{file.fileName}</p>
      <p className="text-xs text-gray-600">Patient: {patients.find(p => p.id === file.patientConsentId)?.firstName || 'N/A'}</p>
      <div className="flex items-center justify-between mt-1 text-gray-500">
        <span className="text-xs">
          {(file.fileSize / 1024 / 1024).toFixed(1)} MB
        </span>
        <span className="text-xs">
          {format(new Date(file.uploadDate), 'MMM d, yyyy')}
        </span>
      </div>

      <div className="mt-3 space-y-2">
          {file.rawStatus === 'new_upload' || file.rawStatus === 'categorized' ? (
              <>
                  <Select
                    value={file.mediaCategory}
                    onValueChange={(value: 'before' | 'after' | 'other') => onCategorize?.(file.id, value, file.dentalAssistantNotes)}
                  >
                      <SelectTrigger className="w-full text-xs h-8">
                          <SelectValue placeholder="Categorize" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="before">Before</SelectItem>
                          <SelectItem value="after">After</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                  </Select>
                  <Button
                      size="sm"
                      className="w-full"
                      onClick={() => onSendForProcessing?.([file.id])}
                  >
                      Approve
                  </Button>
              </>
          ) : file.rawStatus === 'pending_processing' ? (
              <Button
                  size="sm"
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => onDownloadForProcessing(file.id)}
              >
                  <Download className="h-4 w-4 mr-2" /> Download
              </Button>
          ) : (
              <Badge className="w-full text-center py-1.5 bg-gray-100 text-gray-600 font-medium">
                  {file.rawStatus === 'processing_in_progress' ? 'Processing in Progress' :
                   'Processed'}
              </Badge>
          )}
      </div>

      <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => onViewDetails(file)}>
        <Eye className="h-3 w-3 mr-1" /> View Details
      </Button>
    </CardContent>
  </Card>
);

// Main Component
export default function RawMediaManagementPage() {
  const [patients, setPatients] = useState<PatientConsent[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [rawMediaFiles, setRawMediaFiles] = useState<MediaFile[]>([]);
  const [selectedRawMedia, setSelectedRawMedia] = useState<MediaFile | null>(null);
  const [selectedMediaForBulkAction, setSelectedMediaForBulkAction] = useState<string[]>([]);
  const [isPatientSelectOpen, setIsPatientSelectOpen] = useState(false);
  const [isBulkAnnotationModalOpen, setIsBulkAnnotationModalOpen] = useState(false);
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkConsent, setBulkConsent] = useState<PatientConsentLevel>('private_practice_only');
  const [bulkTags, setBulkTags] = useState('');

  // Pagination states
  const [currentPageUnprocessed, setCurrentPageUnprocessed] = useState(1);
  const [currentPagePending, setCurrentPagePending] = useState(1);
  const [currentPageInProgress, setCurrentPageInProgress] = useState(1);
  const [currentPageAllRaw, setCurrentPageAllRaw] = useState(1);

  const itemsPerPage = 12;

  // --- Initial Data Loading ---
  useEffect(() => {
    const mockConsents: PatientConsent[] = [
      { id: 'p1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', procedureType: 'Dental Implants', consentDate: '2024-07-01T09:00:00Z' },
      { id: 'p2', firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', procedureType: 'Teeth Whitening', consentDate: '2024-07-05T10:30:00Z' },
      { id: 'p3', firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com', procedureType: 'Orthodontics', consentDate: '2024-07-10T14:00:00Z' },
      { id: 'p4', firstName: 'David', lastName: 'Lee', email: 'david@example.com', procedureType: 'Crowns', consentDate: '2024-07-15T08:00:00Z' },
      { id: 'p5', firstName: 'Eve', lastName: 'Davis', email: 'eve@example.com', procedureType: 'Fillings', consentDate: '2024-07-18T16:00:00Z' },
      { id: 'p6', firstName: 'Frank', lastName: 'Miller', email: 'frank@example.com', procedureType: 'Bridge', consentDate: '2024-07-20T11:00:00Z' },
      { id: 'p7', firstName: 'Grace', lastName: 'Wilson', email: 'grace@example.com', procedureType: 'Veneers', consentDate: '2024-07-22T09:00:00Z' },
      { id: 'p8', firstName: 'Harry', lastName: 'Moore', email: 'harry@example.com', procedureType: 'Root Canal', consentDate: '2024-07-25T13:00:00Z' },
      { id: 'p9', firstName: 'Ivy', lastName: 'Taylor', email: 'ivy@example.com', procedureType: 'Extraction', consentDate: '2024-07-28T10:00:00Z' },
      { id: 'p10', firstName: 'Jack', lastName: 'Anderson', email: 'jack@example.com', procedureType: 'Cleaning', consentDate: '2024-07-30T15:00:00Z' },
      { id: 'p11', firstName: 'Karen', lastName: 'Thomas', email: 'karen@example.com', procedureType: 'Whitening', consentDate: '2024-08-01T09:00:00Z' },
      { id: 'p12', firstName: 'Liam', lastName: 'Jackson', email: 'liam@example.com', procedureType: 'Implants', consentDate: '2024-08-03T11:00:00Z' },
      { id: 'p13', firstName: 'Mia', lastName: 'White', email: 'mia@example.com', procedureType: 'Orthodontics', consentDate: '2024-08-05T14:00:00Z' },
      { id: 'p14', firstName: 'Noah', lastName: 'Harris', email: 'noah@example.com', procedureType: 'Veneers', consentDate: '2024-08-07T10:00:00Z' },
      { id: 'p15', firstName: 'Olivia', lastName: 'Martin', email: 'olivia@example.com', procedureType: 'Crowns', consentDate: '2024-08-09T09:00:00Z' },
      { id: 'p16', firstName: 'Peter', lastName: 'Garcia', email: 'peter@example.com', procedureType: 'Fillings', consentDate: '2024-08-11T16:00:00Z' },
      { id: 'p17', firstName: 'Quinn', lastName: 'Rodriguez', email: 'quinn@example.com', procedureType: 'Bridge', consentDate: '2024-08-13T11:00:00Z' },
      { id: 'p18', firstName: 'Rachel', lastName: 'Martinez', email: 'rachel@example.com', procedureType: 'Root Canal', consentDate: '2024-08-15T13:00:00Z' },
      { id: 'p19', firstName: 'Sam', lastName: 'Hernandez', email: 'sam@example.com', procedureType: 'Extraction', consentDate: '2024-08-17T10:00:00Z' },
      { id: 'p20', firstName: 'Tina', lastName: 'Lopez', email: 'tina@example.com', procedureType: 'Cleaning', consentDate: '2024-08-19T15:00:00Z' },
      { id: 'p21', firstName: 'Uma', lastName: 'Gonzalez', email: 'uma@example.com', procedureType: 'Implants', consentDate: '2024-08-20T09:00:00Z' },
      { id: 'p22', firstName: 'Victor', lastName: 'Perez', email: 'victor@example.com', procedureType: 'Whitening', consentDate: '2024-08-22T10:00:00Z' },
      { id: 'p23', firstName: 'Wendy', lastName: 'Sanchez', email: 'wendy@example.com', procedureType: 'Orthodontics', consentDate: '2024-08-24T14:00:00Z' },
      { id: 'p24', firstName: 'Xavier', lastName: 'Ramirez', email: 'xavier@example.com', procedureType: 'Veneers', consentDate: '2024-08-26T10:00:00Z' },
      { id: 'p25', firstName: 'Yara', lastName: 'Torres', email: 'yara@example.com', procedureType: 'Crowns', consentDate: '2024-08-28T09:00:00Z' },
    ];

    const mockMedia: MediaFile[] = [
      { id: 'm1', patientConsentId: 'p1', fileName: 'alice-before-1.jpg', fileType: 'image', mediaCategory: 'other', fileSize: 3.2 * 1024 * 1024, uploadDate: '2024-07-02T10:00:00Z', preview: 'https://images.pexels.com/photos/6529883/pexels-photo-6529883.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'new_upload', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'good', suggestedTags: ['full_face', 'before'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: true }, isDuplicate: false } },
      { id: 'm2', patientConsentId: 'p1', fileName: 'alice-before-2.jpg', fileType: 'image', mediaCategory: 'other', fileSize: 2.8 * 1024 * 1024, uploadDate: '2024-07-02T10:05:00Z', preview: 'https://images.pexels.com/photos/6529883/pexels-photo-6529883.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'new_upload', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'fair', suggestedTags: ['full_face', 'before'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: true }, isDuplicate: true } },
      { id: 'm3', patientConsentId: 'p2', fileName: 'bob-after-1.mp4', fileType: 'video', mediaCategory: 'other', fileSize: 15.1 * 1024 * 1024, uploadDate: '2024-07-06T11:00:00Z', preview: 'https://images.pexels.com/photos/6528908/pexels-photo-6528908.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'new_upload', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'excellent', suggestedTags: ['after', 'smile_video'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false } },
      { id: 'm4', patientConsentId: 'p3', fileName: 'charlie-ortho-start.jpg', fileType: 'image', mediaCategory: 'before', fileSize: 4.5 * 1024 * 1024, uploadDate: '2024-07-11T09:30:00Z', preview: 'https://images.pexels.com/photos/6812440/pexels-photo-6812440.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'pending_processing', dentalAssistantNotes: 'Needs color correction and crop', aiAnalysis: { qualityRating: 'good', suggestedTags: ['before', 'orthodontics'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false } },
      { id: 'm5', patientConsentId: 'p1', fileName: 'alice-after-1.jpg', fileType: 'image', mediaCategory: 'after', fileSize: 3.0 * 1024 * 1024, uploadDate: '2024-07-03T14:00:00Z', preview: 'https://images.pexels.com/photos/6529883/pexels-photo-6529883.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'new_upload', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'excellent', suggestedTags: ['after'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false } },
      { id: 'm6', patientConsentId: 'p2', fileName: 'bob-before-1.jpg', fileType: 'image', mediaCategory: 'before', fileSize: 2.1 * 1024 * 1024, uploadDate: '2024-07-05T10:00:00Z', preview: 'https://images.pexels.com/photos/6528908/pexels-photo-6528908.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'categorized', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'good', suggestedTags: ['before', 'teeth_whitening'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false } },
      { id: 'm7', patientConsentId: 'p2', fileName: 'bob-before-2.jpg', fileType: 'image', mediaCategory: 'before', fileSize: 2.3 * 1024 * 1024, uploadDate: '2024-07-05T10:05:00Z', preview: 'https://images.pexels.com/photos/6528908/pexels-photo-6528908.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'categorized', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'good', suggestedTags: ['before', 'teeth_whitening'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: true } },
      { id: 'm8', patientConsentId: 'p2', fileName: 'bob-after-2.jpg', fileType: 'image', mediaCategory: 'after', fileSize: 2.7 * 1024 * 1024, uploadDate: '2024-07-06T11:05:00Z', preview: 'https://images.pexels.com/photos/6528908/pexels-photo-6528908.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'new_upload', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'good', suggestedTags: ['after', 'close_up_smile'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false } },
      { id: 'm9', patientConsentId: 'p4', fileName: 'david-crown-1.jpg', fileType: 'image', mediaCategory: 'before', fileSize: 3.5 * 1024 * 1024, uploadDate: '2024-07-16T10:00:00Z', preview: 'https://images.pexels.com/photos/6529883/pexels-photo-6529883.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'new_upload', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'poor', suggestedTags: ['before', 'crowns'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false } },
      { id: 'm10', patientConsentId: 'p5', fileName: 'eve-filling-1.mp4', fileType: 'video', mediaCategory: 'other', fileSize: 12.0 * 1024 * 1024, uploadDate: '2024-07-19T11:00:00Z', preview: 'https://images.pexels.com/photos/6528908/pexels-photo-6528908.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'new_upload', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'fair', suggestedTags: ['filling', 'patient_reaction'], privacyRisks: { hasPatientInfo: true, hasBlurredFaces: false, exposedInfoDetails: ['patient_chart_in_background'] }, isDuplicate: false } },
      { id: 'm11', patientConsentId: 'p6', fileName: 'frank-bridge-start.jpg', fileType: 'image', mediaCategory: 'before', fileSize: 4.1 * 1024 * 1024, uploadDate: '2024-07-21T09:30:00Z', preview: 'https://images.pexels.com/photos/6812440/pexels-photo-6812440.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'categorized', dentalAssistantNotes: 'Focus on alignment', aiAnalysis: { qualityRating: 'good', suggestedTags: ['bridge', 'before'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false } },
      { id: 'm12', patientConsentId: 'p7', fileName: 'grace-veneers-initial.jpg', fileType: 'image', mediaCategory: 'before', fileSize: 3.8 * 1024 * 1024, uploadDate: '2024-07-23T14:00:00Z', preview: 'https://images.pexels.com/photos/6529883/pexels-photo-6529883.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'new_upload', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'excellent', suggestedTags: ['veneers', 'before', 'full_smile'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false } },
      { id: 'm13', patientConsentId: 'p8', fileName: 'harry-rootcanal-xray.jpg', fileType: 'image', mediaCategory: 'other', fileSize: 1.5 * 1024 * 1024, uploadDate: '2024-07-26T10:00:00Z', preview: 'https://images.pexels.com/photos/6528908/pexels-photo-6528908.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'new_upload', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'good', suggestedTags: ['x-ray', 'root_canal'], privacyRisks: { hasPatientInfo: true, hasBlurredFaces: false, exposedInfoDetails: ['patient_name_on_xray'] }, isDuplicate: false } },
      { id: 'm14', patientConsentId: 'p9', fileName: 'ivy-extraction-site.jpg', fileType: 'image', mediaCategory: 'after', fileSize: 2.2 * 1024 * 1024, uploadDate: '2024-07-29T11:00:00Z', preview: 'https://images.pexels.com/photos/6529883/pexels-photo-6529883.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'categorized', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'fair', suggestedTags: ['extraction', 'after'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false } },
      { id: 'm15', patientConsentId: 'p10', fileName: 'jack-cleaning-before.jpg', fileType: 'image', mediaCategory: 'before', fileSize: 2.5 * 1024 * 1024, uploadDate: '2024-07-31T10:00:00Z', preview: 'https://images.pexels.com/photos/6812440/pexels-photo-6812440.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'new_upload', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'good', suggestedTags: ['cleaning', 'before'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false } },
      { id: 'm_test_pending_1', patientConsentId: 'p1', fileName: 'test-pending-1.jpg', fileType: 'image', mediaCategory: 'before', fileSize: 3.0 * 1024 * 1024, uploadDate: '2024-07-24T10:00:00Z', preview: 'https://images.pexels.com/photos/6529883/pexels-photo-6529883.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'pending_processing', dentalAssistantNotes: 'Urgent processing needed.', aiAnalysis: { qualityRating: 'excellent', suggestedTags: ['close_up', 'before'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false } },
      { id: 'm_test_pending_2', patientConsentId: 'p2', fileName: 'test-pending-2.mp4', fileType: 'video', mediaCategory: 'after', fileSize: 20.0 * 1024 * 1024, uploadDate: '2024-07-24T11:00:00Z', preview: 'https://images.pexels.com/photos/6528908/pexels-photo-6528908.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'pending_processing', dentalAssistantNotes: '', aiAnalysis: { qualityRating: 'good', suggestedTags: ['patient_testimonial', 'after'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false } },
      { id: 'm_test_pending_3', patientConsentId: 'p3', fileName: 'test-pending-3.jpg', fileType: 'image', mediaCategory: 'other', fileSize: 5.0 * 1024 * 1024, uploadDate: '2024-07-24T12:00:00Z', preview: 'https://images.pexels.com/photos/6812440/pexels-photo-6812440.jpeg?auto=compress&cs=tinysrgb&w=300', rawStatus: 'pending_processing', dentalAssistantNotes: 'High resolution, adjust lighting.', aiAnalysis: { qualityRating: 'excellent', suggestedTags: ['procedure_step'], privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false } },
    ];


    const savedConsents = localStorage.getItem('patientConsents');
    setPatients(savedConsents ? JSON.parse(savedConsents) : mockConsents);

    const savedMedia = localStorage.getItem('rawMediaFiles');
    if (savedMedia) {
      const parsedMedia = JSON.parse(savedMedia);
      const initializedMedia: MediaFile[] = parsedMedia.map((m: any) => ({
        ...m,
        rawStatus: (m.rawStatus as RawMediaStatus) || 'new_upload',
        mediaCategory: (m.mediaCategory as 'before' | 'after' | 'other') || 'other',
        dentalAssistantNotes: m.dentalAssistantNotes || '',
        isShowcaseReady: m.isShowcaseReady || false,
        showcaseNotes: m.showcaseNotes || '',
        editedBy: m.editedBy || undefined,
        editedAt: m.editedAt || undefined,
        aiAnalysis: m.aiAnalysis || undefined, // Keep AI analysis if it exists
        patientConsentLevel: m.patientConsentLevel || 'private_practice_only', // Default to private
        workflowSteps: m.workflowSteps || []
      }));
      setRawMediaFiles(initializedMedia as MediaFile[]);
    } else {
      const initializedMockMedia = mockMedia.map(m => ({
        ...m,
        rawStatus: (m.rawStatus as RawMediaStatus) || 'new_upload',
        mediaCategory: (m.mediaCategory as 'before' | 'after' | 'other') || 'other',
        dentalAssistantNotes: m.dentalAssistantNotes || '',
        aiAnalysis: m.aiAnalysis || undefined,
        patientConsentLevel: 'private_practice_only' as PatientConsentLevel,
        workflowSteps: []
      }));
      setRawMediaFiles(initializedMockMedia as MediaFile[]);
      localStorage.setItem('rawMediaFiles', JSON.stringify(initializedMockMedia));
    }
  }, []);


  // --- Filtering Media for Display ---
  const filteredMedia = useMemo(() => {
    return rawMediaFiles.filter(m =>
      selectedPatient === 'all' ? true : m.patientConsentId === selectedPatient
    );
  }, [rawMediaFiles, selectedPatient]);


  const newUploadMedia = useMemo(() => filteredMedia.filter(m => m.rawStatus === 'new_upload'), [filteredMedia]);
  const categorizedMedia = useMemo(() => filteredMedia.filter(m => m.rawStatus === 'categorized'), [filteredMedia]);
  const unprocessedMedia = useMemo(() => [...newUploadMedia, ...categorizedMedia], [newUploadMedia, categorizedMedia]);

  const pendingProcessingMedia = useMemo(() => filteredMedia.filter(m => m.rawStatus === 'pending_processing'), [filteredMedia]);
  const processingInProgressMedia = useMemo(() => filteredMedia.filter(m => m.rawStatus === 'processing_in_progress'), [filteredMedia]);
  const processedMedia = useMemo(() => filteredMedia.filter(m => m.rawStatus === 'processed'), [filteredMedia]);


  // Pagination Calculation Helpers
  const getTotalPages = (totalItems: number) => Math.ceil(totalItems / itemsPerPage);

  const getPaginatedData = (data: MediaFile[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const paginatedUnprocessedMedia = useMemo(() => getPaginatedData(unprocessedMedia, currentPageUnprocessed), [unprocessedMedia, currentPageUnprocessed, itemsPerPage]);
  const paginatedPendingProcessingMedia = useMemo(() => getPaginatedData(pendingProcessingMedia, currentPagePending), [pendingProcessingMedia, currentPagePending, itemsPerPage]);
  const paginatedProcessingInProgressMedia = useMemo(() => getPaginatedData(processingInProgressMedia, currentPageInProgress), [processingInProgressMedia, currentPageInProgress, itemsPerPage]);
  const paginatedAllRawMedia = useMemo(() => getPaginatedData(filteredMedia, currentPageAllRaw), [filteredMedia, currentPageAllRaw, itemsPerPage]);


  // --- Handlers for Raw Media Actions ---
  const handleCategorize = (mediaId: string, category: 'before' | 'after' | 'other', notes?: string) => {
    setRawMediaFiles(prev => {
      const updatedFiles = prev.map(m =>
        m.id === mediaId ? { ...m, mediaCategory: category, rawStatus: 'categorized' as RawMediaStatus, dentalAssistantNotes: notes !== undefined ? notes : m.dentalAssistantNotes } as MediaFile : m
      );
      localStorage.setItem('rawMediaFiles', JSON.stringify(updatedFiles));
      return updatedFiles;
    });
    setSelectedRawMedia(prev => prev && prev.id === mediaId ? { ...prev, mediaCategory: category, rawStatus: 'categorized' as RawMediaStatus, dentalAssistantNotes: notes !== undefined ? notes : prev.dentalAssistantNotes } : prev);
    toast.success(`Media categorized as ${category}`);
  };

  const handleSendForProcessing = (mediaIds: string[]) => {
    setRawMediaFiles(prev => {
      const updatedFiles = prev.map(m =>
        mediaIds.includes(m.id) && (m.rawStatus === 'new_upload' || m.rawStatus === 'categorized')
          ? { ...m, rawStatus: 'pending_processing' as RawMediaStatus } as MediaFile
          : m
      );
      localStorage.setItem('rawMediaFiles', JSON.stringify(updatedFiles));
      return updatedFiles;
    });
    setSelectedRawMedia(prev => prev && mediaIds.includes(prev.id) ? { ...prev, rawStatus: 'pending_processing' as RawMediaStatus } : prev);
    toast.success(`${mediaIds.length} media file(s) sent for processing!`);
    setSelectedMediaForBulkAction([]);
    setCurrentPageUnprocessed(1);
  };

  const handleUpdateNotes = (mediaId: string, notes: string) => {
    setRawMediaFiles(prev => {
      const updatedFiles = prev.map(m =>
        m.id === mediaId ? { ...m, dentalAssistantNotes: notes } as MediaFile : m
      );
      localStorage.setItem('rawMediaFiles', JSON.stringify(updatedFiles));
      return updatedFiles;
    });
    setSelectedRawMedia(prev => prev && prev.id === mediaId ? { ...prev, dentalAssistantNotes: notes } : prev);
  };

  const handleUpdateConsent = (mediaId: string, consent: PatientConsentLevel) => {
    setRawMediaFiles(prev => {
        const updatedFiles = prev.map(m =>
            m.id === mediaId ? { ...m, patientConsentLevel: consent } as MediaFile : m
        );
        localStorage.setItem('rawMediaFiles', JSON.stringify(updatedFiles));
        return updatedFiles;
    });
    setSelectedRawMedia(prev => prev && prev.id === mediaId ? { ...prev, patientConsentLevel: consent } : prev);
    toast.info('Patient consent updated.');
  };

const handleAddTag = (mediaId: string, tag: string) => {
    setRawMediaFiles(prev => {
        const updatedFiles = prev.map(m => {
            if (m.id === mediaId) {
                const updatedAiAnalysis = m.aiAnalysis ? {
                    ...m.aiAnalysis,
                    suggestedTags: m.aiAnalysis.suggestedTags.includes(tag)
                        ? m.aiAnalysis.suggestedTags
                        : [...m.aiAnalysis.suggestedTags, tag]
                } : { 
                    // This is the new object being created, it must match the interface
                    suggestedTags: [tag],
                    qualityRating: 'fair' as AIQualityRating, // Ensure it's of the correct type
                    privacyRisks: { 
                        hasPatientInfo: false, 
                        hasBlurredFaces: false,
                        exposedInfoDetails: [] // Add the missing property
                    }, 
                    isDuplicate: false 
                };
                return { ...m, aiAnalysis: updatedAiAnalysis };
            }
            return m;
        });
        localStorage.setItem('rawMediaFiles', JSON.stringify(updatedFiles));
        return updatedFiles;
    });

    // The second `setRawMediaFiles` call to update the selected item
    setSelectedRawMedia(prev => {
      if (prev && prev.id === mediaId) {
        const updatedTags = prev.aiAnalysis?.suggestedTags.includes(tag)
            ? prev.aiAnalysis.suggestedTags
            : [...(prev.aiAnalysis?.suggestedTags || []), tag];
        
        // This object also needs to conform to the MediaFile type
        const updatedAiAnalysis = prev.aiAnalysis ? {
            ...prev.aiAnalysis,
            suggestedTags: updatedTags
        } : {
            suggestedTags: updatedTags,
            qualityRating: 'fair' as AIQualityRating,
            privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false, exposedInfoDetails: [] },
            isDuplicate: false
        };

        return {
          ...prev,
          aiAnalysis: updatedAiAnalysis
        } as MediaFile;
      }
      return prev;
    });
    
    toast.success('Tag added.');
};

  const handleBulkAnnotate = () => {
    const tagsArray = bulkTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    setRawMediaFiles(prev => {
      const updatedFiles = prev.map(m => {
        if (selectedMediaForBulkAction.includes(m.id)) {
          const currentTags = m.aiAnalysis?.suggestedTags || [];
          const newTags = [...new Set([...currentTags, ...tagsArray])];
          return {
            ...m,
            dentalAssistantNotes: bulkNotes,
            patientConsentLevel: bulkConsent,
            aiAnalysis: m.aiAnalysis
                ? { ...m.aiAnalysis, suggestedTags: newTags }
                : { suggestedTags: newTags, qualityRating: 'fair', privacyRisks: { hasPatientInfo: false, hasBlurredFaces: false }, isDuplicate: false }
          } as MediaFile;
        }
        return m;
      });
      localStorage.setItem('rawMediaFiles', JSON.stringify(updatedFiles));
      return updatedFiles;
    });

    toast.success(`${selectedMediaForBulkAction.length} items updated!`);
    setSelectedMediaForBulkAction([]);
    setBulkNotes('');
    setBulkTags('');
    setBulkConsent('private_practice_only');
    setIsBulkAnnotationModalOpen(false);
  };

  const mockDownloadFromGoogleDrive = async (fileId: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`Simulating download of file ${fileId} from Google Drive.`);
        resolve();
      }, 1500);
    });
  };

  const handleDownloadForProcessing = async (fileId: string) => {
    const fileToDownload = rawMediaFiles.find(f => f.id === fileId);
    if (!fileToDownload) {
        toast.error('File not found for download.');
        return;
    }

    toast.loading(`Downloading "${fileToDownload.fileName}" for processing...`);

    try {
        await mockDownloadFromGoogleDrive(fileId);

        setRawMediaFiles(prev => {
            const updatedFiles = prev.map(m =>
                m.id === fileId
                    ? { ...m, rawStatus: 'processing_in_progress' as RawMediaStatus }
                    : m
            );
            localStorage.setItem('rawMediaFiles', JSON.stringify(updatedFiles));
            return updatedFiles;
        });

        setSelectedRawMedia(prev => prev && prev.id === fileId ? { ...prev, rawStatus: 'processing_in_progress' as RawMediaStatus } : prev);

        toast.success(`"${fileToDownload.fileName}" downloaded successfully! Status updated to 'Processing in Progress'.`);
        setCurrentPagePending(1);
    } catch (error) {
        console.error('Download failed:', error);
        toast.error(`Failed to download "${fileToDownload.fileName}". Please try again.`);
    }
  };

  const downloadMedia = (media: MediaFile) => {
    toast.info(`Initiating general download for ${media.fileName}...`);
    window.open(media.preview, '_blank');
  };

  const handleMediaSelection = (mediaId: string) => {
    setSelectedMediaForBulkAction(prev =>
      prev.includes(mediaId)
        ? prev.filter(id => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  const getPatientFullName = (id: string) => {
    if (id === 'all') return 'All Patients';
    const patient = patients.find(p => p.id === id);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Select Patient...';
  };

  const renderPagination = (totalItems: number, currentPage: number, setCurrentPage: (page: number) => void) => {
    const totalPages = getTotalPages(totalItems);

    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => { e.preventDefault(); setCurrentPage(Math.max(1, currentPage - 1)); }}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          {pages.map(page => (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => { e.preventDefault(); setCurrentPage(Math.min(totalPages, currentPage + 1)); }}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
        <p className="text-gray-600 mt-2">Efficiently categorize, review, and submit newly uploaded patient photos and videos for processing.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Media</CardTitle>
          <CardDescription>Select a patient to view their associated raw media.</CardDescription>
        </CardHeader>
        <CardContent>
          <Popover open={isPatientSelectOpen} onOpenChange={setIsPatientSelectOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isPatientSelectOpen}
                className="w-full md:w-[300px] justify-between"
              >
                {getPatientFullName(selectedPatient)}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full md:w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search patient..." />
                <CommandList>
                  <CommandEmpty>No patient found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={(currentValue) => {
                        setSelectedPatient('all');
                        setIsPatientSelectOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedPatient === 'all' ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All Patients
                    </CommandItem>
                    {patients.map((patient) => (
                      <CommandItem
                        key={patient.id}
                        value={`${patient.firstName} ${patient.lastName} ${patient.id}`}
                        onSelect={() => {
                          setSelectedPatient(patient.id);
                          setIsPatientSelectOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedPatient === patient.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {patient.firstName} {patient.lastName} - {patient.procedureType}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      <Tabs defaultValue="unprocessed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="unprocessed" className="flex items-center justify-center space-x-2">
            <span>Uploads</span>
            <Badge variant="secondary">{unprocessedMedia.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending_processing" className="flex items-center justify-center space-x-2">
            <span>Pending </span>
            <Badge variant="secondary">{pendingProcessingMedia.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="processing_in_progress" className="flex items-center justify-center space-x-2">
            <span>In Progress</span>
            <Badge variant="secondary">{processingInProgressMedia.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all_raw" className="flex items-center justify-center space-x-2">
            <span>All Raw Media</span>
            <Badge variant="secondary">{filteredMedia.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {selectedMediaForBulkAction.length > 0 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white p-4 rounded-lg shadow-xl flex items-center space-x-4 z-50">
                <span>{selectedMediaForBulkAction.length} item(s) selected</span>
                <Button variant="secondary" onClick={() => handleSendForProcessing(selectedMediaForBulkAction)}>
                    <Check className="h-4 w-4 mr-2" />
                    Send Selected for Processing
                </Button>
                <Button variant="secondary" onClick={() => setIsBulkAnnotationModalOpen(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Annotate
                </Button>
                <Button variant="outline" className="text-white hover:bg-blue-700" onClick={() => setSelectedMediaForBulkAction([])}>
                    Clear Selection
                </Button>
            </div>
        )}

        <TabsContent value="unprocessed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Newly Uploaded & Categorized Media</CardTitle>
              <CardDescription>Review, categorize, and send these raw images for professional processing.</CardDescription>
            </CardHeader>
            <CardContent>
              {paginatedUnprocessedMedia.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Image className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-lg font-medium">No new or uncategorized media to review!</p>
                  <p className="text-sm text-gray-400 mt-1">Keep up the great work. All raw media are categorized or sent for processing.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {paginatedUnprocessedMedia.map(file => (
                      <RawMediaCard
                        key={file.id}
                        file={file}
                        patients={patients}
                        selectable={true}
                        onSelect={handleMediaSelection}
                        onCategorize={handleCategorize}
                        onSendForProcessing={handleSendForProcessing}
                        onViewDetails={setSelectedRawMedia}
                        isSelected={selectedMediaForBulkAction.includes(file.id)}
                        onDownloadForProcessing={handleDownloadForProcessing}
                      />
                    ))}
                  </div>
                  <div className="mt-6 flex justify-center">
                    {renderPagination(unprocessedMedia.length, currentPageUnprocessed, setCurrentPageUnprocessed)}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending_processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Pending Processing</CardTitle>
              <CardDescription>These media files have been categorized and are awaiting the editing team's attention.</CardDescription>
            </CardHeader>
            <CardContent>
              {paginatedPendingProcessingMedia.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Check className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-lg font-medium">No media currently pending processing.</p>
                    <p className="text-sm text-gray-400 mt-1">The editing team might be super efficient!</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {paginatedPendingProcessingMedia.map(file => (
                        <RawMediaCard
                          key={file.id}
                          file={file}
                          patients={patients}
                          selectable={false}
                          onViewDetails={setSelectedRawMedia}
                          onDownloadForProcessing={handleDownloadForProcessing}
                        />
                      ))}
                    </div>
                    <div className="mt-6 flex justify-center">
                      {renderPagination(pendingProcessingMedia.length, currentPagePending, setCurrentPagePending)}
                    </div>
                  </>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing_in_progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Processing In Progress</CardTitle>
              <CardDescription>These media files are currently being enhanced by the editing team.</CardDescription>
            </CardHeader>
            <CardContent>
              {paginatedProcessingInProgressMedia.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-lg font-medium">No media currently being processed.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {paginatedProcessingInProgressMedia.map(file => (
                        <RawMediaCard
                          key={file.id}
                          file={file}
                          patients={patients}
                          selectable={false}
                          onViewDetails={setSelectedRawMedia}
                          onDownloadForProcessing={handleDownloadForProcessing}
                        />
                      ))}
                    </div>
                    <div className="mt-6 flex justify-center">
                      {renderPagination(processingInProgressMedia.length, currentPageInProgress, setCurrentPageInProgress)}
                    </div>
                  </>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all_raw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Raw Media ({filteredMedia.length})</CardTitle>
              <CardDescription>A comprehensive list of all raw media uploaded, regardless of status.</CardDescription>
            </CardHeader>
            <CardContent>
              {paginatedAllRawMedia.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Image className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-lg font-medium">No raw media uploaded yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Start by uploading new patient photos and videos.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {paginatedAllRawMedia.map(file => (
                        <RawMediaCard
                          key={file.id}
                          file={file}
                          patients={patients}
                          selectable={true}
                          onSelect={handleMediaSelection}
                          onCategorize={handleCategorize}
                          onSendForProcessing={handleSendForProcessing}
                          onViewDetails={setSelectedRawMedia}
                          isSelected={selectedMediaForBulkAction.includes(file.id)}
                          onDownloadForProcessing={handleDownloadForProcessing}
                        />
                      ))}
                    </div>
                    <div className="mt-6 flex justify-center">
                      {renderPagination(filteredMedia.length, currentPageAllRaw, setCurrentPageAllRaw)}
                    </div>
                  </>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Raw Media Details Modal */}
      {selectedRawMedia && (
          <Dialog open={!!selectedRawMedia} onOpenChange={() => setSelectedRawMedia(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                      <DialogTitle className="text-2xl">{selectedRawMedia.fileName}</DialogTitle>
                      <DialogDescription>
                          Detailed view and management for this raw media file.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                      <div className="relative rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center p-2">
                          {selectedRawMedia.fileType === 'image' ? (
                              <img
                                  src={selectedRawMedia.preview}
                                  alt={selectedRawMedia.fileName}
                                  className="w-full h-auto max-h-[50vh] object-contain rounded-md"
                              />
                          ) : (
                              <video
                                  src={selectedRawMedia.preview}
                                  controls
                                  className="w-full h-auto max-h-[50vh] object-contain rounded-md"
                              >
                                  Your browser does not support the video tag.
                              </video>
                          )}
                      </div>

                      <div className="space-y-4">
                          <div>
                              <h4 className="font-semibold text-lg">Patient: {patients.find(p => p.id === selectedRawMedia.patientConsentId)?.firstName} {patients.find(p => p.id === selectedRawMedia.patientConsentId)?.lastName}</h4>
                              <p className="text-sm text-gray-600">Procedure: {patients.find(p => p.id === selectedRawMedia.patientConsentId)?.procedureType}</p>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Uploaded: {format(new Date(selectedRawMedia.uploadDate), 'PPP')}</span>
                              <span>Size: {(selectedRawMedia.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                          </div>
                          <Badge className={`text-base font-medium py-1 px-3 ${
                              selectedRawMedia.rawStatus === 'new_upload' ? 'bg-purple-100 text-purple-800' :
                              selectedRawMedia.rawStatus === 'categorized' ? 'bg-orange-100 text-orange-800' :
                              selectedRawMedia.rawStatus === 'pending_processing' ? 'bg-blue-100 text-blue-800' :
                              selectedRawMedia.rawStatus === 'processing_in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                          }`}>
                              Status: {selectedRawMedia.rawStatus.replace(/_/g, ' ')}
                          </Badge>

                          {/* AI Analysis Section */}
                          {selectedRawMedia.aiAnalysis && (
                              <div className="space-y-2">
                                  <h5 className="font-semibold text-sm">AI Analysis</h5>
                                  <div className="flex flex-wrap gap-2">
                                      <Badge variant="outline">Quality: {selectedRawMedia.aiAnalysis.qualityRating}</Badge>
                                      {selectedRawMedia.aiAnalysis.privacyRisks.hasPatientInfo && <Badge variant="destructive">Privacy Risk</Badge>}
                                      {selectedRawMedia.aiAnalysis.privacyRisks.hasBlurredFaces && <Badge variant="destructive">Blurred Faces</Badge>}
                                      {selectedRawMedia.aiAnalysis.isDuplicate && <Badge className="bg-yellow-100 text-yellow-800">Duplicate</Badge>}
                                  </div>
                                  {selectedRawMedia.aiAnalysis.suggestedTags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                          {selectedRawMedia.aiAnalysis.suggestedTags.map(tag => (
                                              <Badge key={tag} className="cursor-pointer" onClick={() => handleAddTag(selectedRawMedia.id, tag)}>{tag}</Badge>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          )}

                          <div className="space-y-2">
                              <Label htmlFor="mediaCategory" className="text-base">Category</Label>
                              <Select
                                  value={selectedRawMedia.mediaCategory}
                                  onValueChange={(value: 'before' | 'after' | 'other') => handleCategorize(selectedRawMedia.id, value, selectedRawMedia.dentalAssistantNotes)}
                                  disabled={selectedRawMedia.rawStatus === 'pending_processing' || selectedRawMedia.rawStatus === 'processing_in_progress' || selectedRawMedia.rawStatus === 'processed'}
                              >
                                  <SelectTrigger id="mediaCategory" className="h-10 text-base">
                                      <SelectValue placeholder="Select Category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="before">Before</SelectItem>
                                      <SelectItem value="after">After</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="patientConsent" className="text-base">Patient Consent</Label>
                              <Select
                                  value={selectedRawMedia.patientConsentLevel || 'private_practice_only'}
                                  onValueChange={(value: PatientConsentLevel) => handleUpdateConsent(selectedRawMedia.id, value)}
                              >
                                  <SelectTrigger id="patientConsent" className="h-10 text-base">
                                      <SelectValue placeholder="Select Consent Level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="public_showcase">Public Showcase</SelectItem>
                                      <SelectItem value="private_practice_only">Private Practice Only</SelectItem>
                                      <SelectItem value="no_use">No Use</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="assistantNotes" className="text-base">Dental Assistant Notes (for processing team)</Label>
                              <Textarea
                                  id="assistantNotes"
                                  placeholder="Add notes for the editing team (e.g., 'focus on color balance', 'remove background element')..."
                                  value={selectedRawMedia.dentalAssistantNotes || ''}
                                  onChange={(e) => handleUpdateNotes(selectedRawMedia.id, e.target.value)}
                                  disabled={selectedRawMedia.rawStatus === 'processing_in_progress' || selectedRawMedia.rawStatus === 'processed'}
                                  rows={4}
                              />
                          </div>
                          <div className="flex gap-3 pt-2">
                              {selectedRawMedia.rawStatus === 'pending_processing' ? (
                                <Button
                                    className="flex-1 text-lg py-6 bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => handleDownloadForProcessing(selectedRawMedia.id)}
                                >
                                    <Download className="h-5 w-5 mr-2" />
                                    Download
                                </Button>
                              ) : (
                                <Button
                                    className="flex-1 text-lg py-6"
                                    onClick={() => handleSendForProcessing([selectedRawMedia.id])}
                                    disabled={
                                        selectedRawMedia.rawStatus !== 'new_upload' &&
                                        selectedRawMedia.rawStatus !== 'categorized'
                                    }
                                >
                                    <Check className="h-5 w-5 mr-2" />
                                    Approve
                                </Button>
                              )}
                              <Button variant="outline" className="flex-1 text-lg py-6" onClick={() => downloadMedia(selectedRawMedia)}>
                                  <Download className="h-5 w-5 mr-2" />
                                  Download Raw (General)
                              </Button>
                          </div>
                      </div>
                  </div>
              </DialogContent>
          </Dialog>
      )}

      {/* Bulk Annotation Modal */}
      <Dialog open={isBulkAnnotationModalOpen} onOpenChange={setIsBulkAnnotationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Annotation</DialogTitle>
            <DialogDescription>
              Apply notes and settings to {selectedMediaForBulkAction.length} selected items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="bulkNotes">Notes</Label>
                <Textarea
                    id="bulkNotes"
                    placeholder="Add a common note for all selected files..."
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="bulkTags">Add Tags (comma-separated)</Label>
                <Input
                    id="bulkTags"
                    placeholder="e.g., best_before, smile_shot, full_arch"
                    value={bulkTags}
                    onChange={(e) => setBulkTags(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="bulkConsent">Patient Consent</Label>
                <Select
                    value={bulkConsent}
                    onValueChange={(value: PatientConsentLevel) => setBulkConsent(value)}
                >
                    <SelectTrigger id="bulkConsent">
                        <SelectValue placeholder="Select Consent Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="public_showcase">Public Showcase</SelectItem>
                        <SelectItem value="private_practice_only">Private Practice Only</SelectItem>
                        <SelectItem value="no_use">No Use</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button className="w-full" onClick={handleBulkAnnotate}>
                Apply to {selectedMediaForBulkAction.length} Items
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}