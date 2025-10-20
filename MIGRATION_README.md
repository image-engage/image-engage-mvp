# Completed Sessions Fix - Migration Guide

## Changes Made

### 1. Database Migration
- Created `patient_workflow_sessions` table to track patient workflow progress
- Added proper relationships between patients, photo sessions, and workflow states

### 2. Backend Fixes
- Updated `CompletedSessionsService` to properly handle before/after photos, PDFs, and media
- Improved file handling and URL generation for downloads
- Added better error handling and file type detection
- Enhanced consent PDF retrieval from both database and storage

### 3. Frontend Improvements
- Fixed API calls to include authentication tokens
- Improved download functionality for all media types
- Added better error handling for broken images
- Enhanced file display with proper thumbnails and metadata

## Running the Migration

### Option 1: Using the Migration Script
```bash
cd backend
node run-migration.js
```

### Option 2: Manual SQL Execution
Run the SQL from `backend/src/migrations/20250109000000_create_workflow_sessions.sql` in your Supabase SQL editor.

## Key Features Fixed

1. **Before/After Photo Separation**: Photos are now properly categorized and displayed
2. **PDF Consent Forms**: Consent PDFs are retrieved from both database records and storage
3. **Video Support**: Video files are properly handled and displayed
4. **Download Functionality**: All media types can be downloaded with proper authentication
5. **File Metadata**: File sizes and types are properly detected and displayed
6. **Search and Filtering**: Sessions can be searched by patient name or procedure type

## API Endpoints

- `GET /api/completed-sessions` - Get all completed sessions with media
- `GET /api/completed-sessions/download/:fileId` - Download specific media file

## File Structure

The system now properly handles files stored in:
- `{practiceId}/_RawPhotos/Before/{sessionId}/` - Before photos/videos
- `{practiceId}/_RawPhotos/After/{sessionId}/` - After photos/videos  
- `{practiceId}/_ConsentForms/Before/{sessionId}/` - Consent PDFs

## Testing

1. Complete a patient workflow (consent + before/after photos)
2. Navigate to "View Media" in the dashboard
3. Verify all media types are displayed correctly
4. Test download functionality for each media type
5. Test search and filtering capabilities