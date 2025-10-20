import axios from 'axios'
import { InstagramPost } from '../../../types'

interface PublishPhotoParams {
  imageBuffer: Buffer
  caption: string
  scheduleTime?: string | null
}

export class InstagramService {
  private accessToken: string
  private businessAccountId: string
  
  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || ''
    this.businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || ''
  }
  
  async publishPhoto(params: PublishPhotoParams): Promise<InstagramPost> {
    const { imageBuffer, caption, scheduleTime } = params
    
    try {
      // Step 1: Upload image to a temporary hosting service or use Facebook Graph API
      // For this example, we'll use the Instagram Basic Display API approach
      // In production, you might want to use a proper image hosting service
      
      // Step 2: Create media container
      const mediaResponse = await this.createMediaContainer(imageBuffer, caption)
      const creationId = mediaResponse.id
      
      // Step 3: Publish the media
      if (scheduleTime) {
        // Schedule for later (if supported by your Instagram API tier)
        return this.schedulePost(creationId, scheduleTime)
      } else {
        // Publish immediately
        return this.publishPost(creationId)
      }
    } catch (error) {
      console.error('Instagram publish failed:', error)
      throw new Error(`Failed to publish to Instagram: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  private async createMediaContainer(imageBuffer: Buffer, caption: string): Promise<{ id: string }> {
    // Convert buffer to base64 for API upload
    const base64Image = imageBuffer.toString('base64')
    
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.businessAccountId}/media`,
        {
          image_url: `data:image/jpeg;base64,${base64Image}`,
          caption: caption,
          access_token: this.accessToken
        }
      )
      
      return response.data
    } catch (error) {
      console.error('Failed to create media container:', error)
      throw new Error('Failed to create Instagram media container')
    }
  }
  
  private async publishPost(creationId: string): Promise<InstagramPost> {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.businessAccountId}/media_publish`,
        {
          creation_id: creationId,
          access_token: this.accessToken
        }
      )
      
      const postId = response.data.id
      
      // Get post details
      const postDetails = await this.getPostDetails(postId)
      
      return postDetails
    } catch (error) {
      console.error('Failed to publish post:', error)
      throw new Error('Failed to publish Instagram post')
    }
  }
  
  private async schedulePost(creationId: string, scheduleTime: string): Promise<InstagramPost> {
    const scheduledTime = Math.floor(new Date(scheduleTime).getTime() / 1000)
    
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.businessAccountId}/media_publish`,
        {
          creation_id: creationId,
          published: false,
          scheduled_publish_time: scheduledTime,
          access_token: this.accessToken
        }
      )
      
      return {
        id: response.data.id,
        permalink: '',
        timestamp: scheduleTime
      }
    } catch (error) {
      console.error('Failed to schedule post:', error)
      // Fall back to immediate publishing
      return this.publishPost(creationId)
    }
  }
  
  private async getPostDetails(postId: string): Promise<InstagramPost> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${postId}`,
        {
          params: {
            fields: 'id,permalink,timestamp',
            access_token: this.accessToken
          }
        }
      )
      
      return response.data
    } catch (error) {
      console.error('Failed to get post details:', error)
      return {
        id: postId,
        permalink: '',
        timestamp: new Date().toISOString()
      }
    }
  }
}

export const instagramService = new InstagramService()