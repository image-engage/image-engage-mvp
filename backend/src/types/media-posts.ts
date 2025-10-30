import { Request } from 'express';

// ============================================
// API Response Types
// ============================================

/**
 * Standard API response format
 */
export interface ApiResponse {
  success: boolean;
  message: string;
  message2?: string;
  data?: any;
  error?: string;
}

// ============================================
// Media Post Types
// ============================================

/**
 * Media Post interface matching your Supabase table structure
 */
export interface MediaPost {
  id: string;
  file_name: string;
  file_path: string;
  bucket_name: string;
  caption: string;
  image_url: string;
  media_id?: string;
  permalink?: string;
  status: 'pending' | 'approved' | 'declined' | 'posted';
  error_message?: string;
  created_at: string;
  posted_at?: string;
  
  // Extended fields for social media management
  target_platforms?: string[]; // Store as JSONB in Supabase
  hashtags?: string;
  media_type?: 'photo' | 'video';
}


export interface CreateMediaPostRequest {
  file_name: string;
  file_path: string;
  bucket_name?: string;
  image_url: string;
  caption?: string;
  hashtags?: string;
  targetPlatforms?: string[];
  media_type?: 'photo' | 'video';
  media_id?: string;
  permalink?: string;
}

/**
 * Filters for querying media posts
 */
export interface MediaPostFilters {
  status?: string;
  mediaType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Update payload for media posts
 */
export interface MediaPostUpdate {
  caption?: string;
  hashtags?: string;
  targetPlatforms?: string[];
  status?: 'pending' | 'approved' | 'declined' | 'posted';
}

/**
 * Bulk status update request
 */
export interface BulkStatusUpdate {
  ids: string[];
  status: 'pending' | 'approved' | 'declined' | 'posted';
}

// ============================================
// Upload Types (from existing system)
// ============================================

/**
 * Upload request data structure
 */
export interface UploadRequest {
  practiceId: string;
  patientId: string;
  patientPhotoId: string;
  files: Express.Multer.File[];
  categories: string[];
  mediaTypes: string[];
}

/**
 * Media file record from database
 */
export interface MediaFile {
  id: string;
  practice_id: string;
  patient_id: string;
  patient_photo_id: string;
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

// ============================================
// Authentication Types
// ============================================

/**
 * Authenticated request extending Express Request
 */
export interface AuthenticatedRequest extends Request {
  practiceId?: string;
  practiceEmail?: string;
  user?: {
    id: string;
    userId: string;
    sub: string;
    email: string;
    given_name?: string;
    family_name?: string;
    practiceId: string;
    "custom:practice_id": string;
    "custom:role": string;
    "custom:practice_name": string;
    iat?: number;
    exp?: number;
  };
}

// ============================================
// Validation Types
// ============================================

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Storage service result
 */
export interface StorageResult {
  path: string;
  url: string;
  fileName: string;
}

// ============================================
// Statistics Types
// ============================================

/**
 * Media post statistics
 */
export interface MediaPostStatistics {
  total: number;
  pending: number;
  approved: number;
  declined: number;
  posted: number;
  photoCount?: number;
  videoCount?: number;
}

// ============================================
// Database Query Types
// ============================================

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  posts: T[];
  pagination: PaginationMeta;
}

// ============================================
// Social Media Types
// ============================================

/**
 * Social media platform enum
 */
export type SocialPlatform = 'Instagram' | 'Facebook' | 'TikTok' | 'YouTube' | 'LinkedIn';

/**
 * Post scheduling information
 */
export interface PostSchedule {
  scheduledFor?: string;
  timezone?: string;
  autoPost?: boolean;
}

/**
 * Social media post metadata
 */
export interface SocialMediaMetadata {
  platforms: SocialPlatform[];
  caption: string;
  hashtags: string[];
  mentions?: string[];
  location?: string;
}

// ============================================
// Error Types
// ============================================

/**
 * Custom error codes
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  RETRIEVAL_ERROR = 'RETRIEVAL_ERROR',
  UPDATE_ERROR = 'UPDATE_ERROR',
  DELETE_ERROR = 'DELETE_ERROR',
  BULK_UPDATE_ERROR = 'BULK_UPDATE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  DATABASE_ERROR = 'DATABASE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR'
}

/**
 * Application error
 */
export interface AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: any;
}