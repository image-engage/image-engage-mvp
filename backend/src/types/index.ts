// src/types.ts

import { Request } from 'express';


// This interface extends the Express Request to include the 'user' property
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// --- JWT Payload Definition ---
// This defines the structure of the data that will be stored inside your JWT token.
// It's what your authentication middleware will attach to req.user.
export interface JWTPayload {
  id: string;
  userId: string; 
  email: string;
  practiceId: string; // Ensure this is always present in your token
  iat?: number; // Issued at (optional, typically added by jwt.sign)
  exp?: number; // Expiration time (optional, typically added by jwt.sign)
}

// --- Database Model Interfaces ---
// These interfaces define the structure of your data as it appears in the database.
// They should reflect your SQL schema.

export interface Practice {
  id: string;
  name: string;
  // Removed email and password_hash as they are now in the User table
  phone?: string | null; // Use null for optional database fields
  address?: string | null;
  logo_url?: string | null;
  branding_colors?: {
    primary: string;
    secondary: string;
    accent: string;
  } | null;
  social_media?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  } | null;
  google_drive_folder_id?: string | null;
  google_refresh_token?: string | null;
  isonboarded: boolean
  created_at: string; // ISO 8601 string
  updated_at: string; // ISO 8601 string
}

export interface User {
  id: string; // This should ideally match Supabase Auth's user ID (auth.uid()) or your own UUID
  practice_id: string; // Foreign key to the Practice
  email: string;
  password_hash: string; // ONLY on backend, never send to frontend or store in JWT
  first_name: string;
  last_name: string;
  role: 'admin' | 'staff' | 'owner';
  email_verified?: boolean; // Email verification status
  created_at: string;
  updated_at: string;
}

export interface PatientConsent {
  id: string;
  practice_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  consent_status: 'active' | 'revoked';
  consent_date: string;
  last_photo_session?: string | null;
  procedure_type: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsentForm {
  id: string;
  practice_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  procedure_type: string;
  notes?: string | null;
  consent_date: string; // ISO 8601 date string
  status: 'completed' | 'pending';
  signature_data?: string | null;
  shared_content?: SharedContent[] | null; // Assuming this is JSONB array
  created_at: string;
  updated_at: string;
}

export interface SharedContent {
  id: string;
  title: string;
  content_type: 'article' | 'pdf' | 'video' | 'image';
  shared_at: string; // ISO 8601 string
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type: 'article' | 'pdf' | 'video' | 'image';
  category: string;
  file_name: string;
  file_size: number;
  file_path: string;
  tags: string[]; // Assuming this is JSONB array of strings
  is_active: boolean;
  created_by: string; // User ID
  created_at: string;
  updated_at: string;
}

export interface PhotoSession {
  id: string;
  practice_id: string;
  patient_id: string; // FK to PatientConsent
  patient_photo_id: string; // This seems like a duplicate or related to PatientMedia
  session_date: string; // ISO 8601 date string
  photos_count: number;
  google_drive_folder_path: string;
  status: 'uploaded' | 'processing' | 'ready' | 'published';
  created_at: string;
  updated_at: string;
}


export interface PatientMedia { 
  id: string;
  patient_consent_id: string; // FK to PatientConsent
  file_name: string;
  original_name: string;
  file_type: 'image' | 'video';
  media_category: 'before' | 'after';
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string; // User ID
  upload_date: string; // ISO 8601 date string
  created_at: string;
  updated_at: string;
}

export interface ReviewSettings {
  id: string;
  practice_id: string; // Link to practice
  email_enabled: boolean;
  sms_enabled: boolean;
  email_template: string;
  sms_template: string;
  review_platforms: ReviewPlatform[]; // JSONB array
  delay_hours: number;
  created_by: string; // User ID
  created_at: string;
  updated_at: string;
}

export interface ReviewPlatform {
  name: string;
  url: string;
  enabled: boolean;
}

export interface ReviewRequest {
  id: string;
  patient_consent_id: string; // FK to PatientConsent
  request_type: 'email' | 'sms';
  status: 'sent' | 'clicked' | 'reviewed' | 'failed';
  sent_at: string; // ISO 8601 string
  clicked_at?: string | null;
  reviewed_at?: string | null;
  review_platform: string;
  review_url: string;
  message_content: string;
  created_at: string;
  updated_at: string;
}

export interface Photo { 
  id: string
  name: string
  thumbnailUrl: string
  downloadUrl: string
  status: 'completed' | 'pending' | 'processing'
  modifiedTime: string
  size: number
  mimeType: string
}

export interface PublishConfig {
  folderId: string
  caption: string
  tags: string[]
  scheduleTime: string | null
}

export interface InstagramPost {
  id: string
  permalink: string
  timestamp: string
}

export interface PublishResult {
  photoId: string
  photoName: string
  success: boolean
  message: string
  instagramPost?: InstagramPost
}


// --- API Response Structure ---
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  message2?: string; // Using message2 as per your existing code
  data?: T;
  error?: string; // For general error messages
  pagination?: { // If you implement pagination
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


// --- Express Request Augmentation ---
// This extends the Express Request interface to include the 'user' property
// which your authentication middleware will attach after decoding the JWT.
declare module 'express-serve-static-core' {
  interface Request {
    user?: JWTPayload; // The 'user' property will hold the decoded JWT payload
  }
}
export interface SharedContent {
  id: string;
  title: string;
  content_type: 'article' | 'pdf' | 'video' | 'image';
  shared_at: string;
}

export interface PatientProfile {
  id: string;
  practice_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface ConsentForm {
  id: string;
  practice_id: string;
  patient_id: string;
  procedure_type: string;
  notes?: string | null;
  consent_date: string;
  status: 'completed' | 'pending';
  signature_data?: string | null;
  shared_content?: SharedContent[] | null;
  created_at: string;
  updated_at: string;
  // This is how the data is returned after the join, so we need to add the patient properties here
  // The `patients` property is for the join, the others are for the formatted output
  patients?: PatientProfile;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
}

export interface PhotoSession {
  id: string;
  practice_id: string;
  patient_id: string;
  patient_photo_id: string;
  session_date: string;
  photos_count: number;
  storage_folder_path: string;
  photo_type: 'Before' | 'After' | 'Other';
  status: "uploaded" | "processing" | "ready" | "published";
  created_at: string;
  updated_at: string;
}


export interface MediaFile {
  id?: string;
  practice_id: string;
  patient_photo_id: string;
  patient_id: string;
  category: 'before' | 'after' | 'other';
  media_type: 'photo' | 'video';
  file_type: string;
  original_filename: string;
  storage_path: string;
  storage_url: string;
  file_size: number;
  upload_timestamp: string;
  created_at?: string;
  updated_at?: string;
}

export interface UploadRequest {
  practiceId: string;
  patientId: string;
  patientPhotoId: string;
  files: Express.Multer.File[];
  categories: string[];
  mediaTypes: string[];
}

export interface StorageUploadResult {
  size: any;
  path: string;
  url: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface UploadResponse {
  filesUploaded: number;
  files: Array<{
    fileName: string;
    path: string;
    size: number;
  }>;
}

export interface GoogleDriveAuth {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}