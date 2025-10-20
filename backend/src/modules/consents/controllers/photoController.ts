// import { NextRequest, NextResponse } from 'next/server'
// import { googleDriveService } from '../services/googleDriveService'
// import { AuthUtils } from '../../utils/auth'

// export class PhotoController {
//   async getPhotosFromFolder(request: NextRequest, folderId: string) {
//     try {
//       const token = request.cookies.get('auth_token')?.value
      
//       if (!token) {
//         return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
//       }
      
//       const payload = AuthUtils.verifyJWT(token)
//       const photos = await googleDriveService.getPhotosFromFolder(payload.tokens, folderId)
      
//       return NextResponse.json({ photos })
//     } catch (error) {
//       console.error('Failed to get photos:', error)
//       return NextResponse.json({ error: 'Failed to retrieve photos' }, { status: 500 })
//     }
//   }

//   async downloadPhoto(request: NextRequest, photoId: string) {
//     try {
//       const token = request.cookies.get('auth_token')?.value
      
//       if (!token) {
//         return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
//       }
      
//       const payload = AuthUtils.verifyJWT(token)
//       const photoBuffer = await googleDriveService.downloadPhoto(payload.tokens, photoId)
      
//       return new NextResponse(photoBuffer, {
//         headers: {
//           'Content-Type': 'image/jpeg',
//           'Content-Length': photoBuffer.length.toString()
//         }
//       })
//     } catch (error) {
//       console.error('Failed to download photo:', error)
//       return NextResponse.json({ error: 'Failed to download photo' }, { status: 500 })
//     }
//   }
// }

// export const photoController = new PhotoController()