import { google } from 'googleapis'
import { GoogleDriveAuth, Photo } from '../../../types'

export class GoogleDriveService {
  private oauth2Client: any
  
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI
    )
  }
  
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file'
    ]
    
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    })
  }
  
  async exchangeCodeForTokens(code: string): Promise<GoogleDriveAuth> {
    const { tokens } = await this.oauth2Client.getToken(code)
    return tokens as GoogleDriveAuth
  }
  
  async validateTokens(tokens: GoogleDriveAuth): Promise<boolean> {
    try {
      this.oauth2Client.setCredentials(tokens)
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client })
      
      // Try to make a simple API call to validate tokens
      await drive.files.list({ pageSize: 1 })
      return true
    } catch (error) {
      console.error('Token validation failed:', error)
      return false
    }
  }
  
  async getPhotosFromFolder(tokens: GoogleDriveAuth, folderId: string): Promise<Photo[]> {
    this.oauth2Client.setCredentials(tokens)
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client })
    
    try {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
        fields: 'files(id,name,thumbnailLink,webContentLink,modifiedTime,size,mimeType,properties)',
        pageSize: 100
      })
      
      const files = response.data.files || []
      
      return files.map((file: any): Photo => ({
        id: file.id,
        name: file.name,
        thumbnailUrl: file.thumbnailLink || '',
        downloadUrl: file.webContentLink || '',
        status: this.getPhotoStatus(file.properties),
        modifiedTime: file.modifiedTime,
        size: parseInt(file.size || '0'),
        mimeType: file.mimeType
      }))
    } catch (error) {
      console.error('Failed to get photos from folder:', error)
      throw new Error('Failed to retrieve photos from Google Drive')
    }
  }
  
  async getPhotoInfo(tokens: GoogleDriveAuth, photoId: string): Promise<Photo> {
    this.oauth2Client.setCredentials(tokens)
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client })
    
    try {
      const response = await drive.files.get({
        fileId: photoId,
        fields: 'id,name,thumbnailLink,webContentLink,modifiedTime,size,mimeType,properties'
      })
      
      const file = response.data
      
      return {
        id: file.id!,
        name: file.name!,
        thumbnailUrl: file.thumbnailLink || '',
        downloadUrl: file.webContentLink || '',
        status: this.getPhotoStatus(file.properties),
        modifiedTime: file.modifiedTime!,
        size: parseInt(file.size || '0'),
        mimeType: file.mimeType!
      }
    } catch (error) {
      console.error('Failed to get photo info:', error)
      throw new Error('Failed to retrieve photo information')
    }
  }
  
  async downloadPhoto(tokens: GoogleDriveAuth, photoId: string): Promise<Buffer> {
    this.oauth2Client.setCredentials(tokens)
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client })
    
    try {
      const response = await drive.files.get({
        fileId: photoId,
        alt: 'media'
      }, { responseType: 'arraybuffer' })
      
      return Buffer.from(response.data as ArrayBuffer)
    } catch (error) {
      console.error('Failed to download photo:', error)
      throw new Error('Failed to download photo from Google Drive')
    }
  }
  
  private getPhotoStatus(properties: any): 'completed' | 'pending' | 'processing' {
    // Check custom properties for photo status
    // You can set these properties in Google Drive using the API or custom tools
    if (properties && properties.status) {
      return properties.status as 'completed' | 'pending' | 'processing'
    }
    
    // Default to completed for now - you might want to implement different logic
    return 'completed'
  }
}

export const googleDriveService = new GoogleDriveService()