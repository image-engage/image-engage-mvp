// import { NextRequest, NextResponse } from 'next/server'
// import { googleDriveService } from '../services/googleDriveService'
// import { instagramService } from '../services/instagramService'
// import { AuthUtils } from '../../../utils/auth'
// import { PublishConfig, PublishResult } from '../../../types'

// export class PublishController {
//   async publishPhotos(request: NextRequest, photoIds: string[], config: PublishConfig) {
//     try {
//       const token = request.cookies.get('auth_token')?.value
      
//       if (!token) {
//         return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
//       }
      
//       const payload = AuthUtils.verifyJWT(token)
//       const results: PublishResult[] = []
      
//       for (const photoId of photoIds) {
//         try {
//           // Get photo info from Google Drive
//           const photoInfo = await googleDriveService.getPhotoInfo(payload.tokens, photoId)
          
//           // Check if photo is marked as completed
//           if (photoInfo.status !== 'completed') {
//             results.push({
//               photoId,
//               photoName: photoInfo.name,
//               success: false,
//               message: `Photo "${photoInfo.name}" is not marked as completed`
//             })
//             continue
//           }
          
//           // Download photo
//           const photoBuffer = await googleDriveService.downloadPhoto(payload.tokens, photoId)
          
//           // Prepare caption with tags
//           const caption = this.buildCaption(config.caption, config.tags)
          
//           // Upload to Instagram
//           const instagramPost = await instagramService.publishPhoto({
//             imageBuffer: photoBuffer,
//             caption,
//             scheduleTime: config.scheduleTime
//           })
          
//           results.push({
//             photoId,
//             photoName: photoInfo.name,
//             success: true,
//             message: `Successfully published "${photoInfo.name}" to Instagram`,
//             instagramPost
//           })
          
//           // Add delay between posts to avoid rate limiting
//           await this.delay(2000)
          
//         } catch (error) {
//           console.error(`Failed to publish photo ${photoId}:`, error)
//           results.push({
//             photoId,
//             photoName: `Photo ${photoId}`,
//             success: false,
//             message: `Failed to publish: ${error instanceof Error ? error.message : 'Unknown error'}`
//           })
//         }
//       }
      
//       return NextResponse.json({ results })
//     } catch (error) {
//       console.error('Publish operation failed:', error)
//       return NextResponse.json({ error: 'Publish operation failed' }, { status: 500 })
//     }
//   }
  
//   private buildCaption(baseCaption: string, tags: string[]): string {
//     const hashTags = tags.map(tag => `#${tag}`).join(' ')
//     return baseCaption + (hashTags ? `\n\n${hashTags}` : '')
//   }
  
//   private delay(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms))
//   }
// }

// export const publishController = new PublishController()