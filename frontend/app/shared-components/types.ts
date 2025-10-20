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

export interface PublishStatusProps {
  status: string[]
  isPublishing: boolean
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

export interface GoogleDriveAuth {
  access_token: string
  refresh_token: string
  scope: string
  token_type: string
  expires_at: number
}