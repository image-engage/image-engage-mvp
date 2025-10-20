// import { NextRequest, NextResponse } from 'next/server'
// import { googleDriveService } from '../services/googleDriveService'
// import { AuthUtils } from '../../utils/auth'

// export class AuthController {
//   async initiateGoogleAuth() {
//     try {
//       const authUrl = googleDriveService.getAuthUrl()
//       return NextResponse.redirect(authUrl)
//     } catch (error) {
//       console.error('Auth initiation failed:', error)
//       return NextResponse.json({ error: 'Failed to initiate authentication' }, { status: 500 })
//     }
//   }

//   async handleGoogleCallback(request: NextRequest, code: string) {
//     try {
//       const tokens = await googleDriveService.exchangeCodeForTokens(code)
//       const jwt = AuthUtils.generateJWT({ tokens })
      
//       const response = NextResponse.json({ success: true })
//       response.cookies.set('auth_token', jwt, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'strict',
//         maxAge: 60 * 60 * 24 * 7 // 7 days
//       })
      
//       return response
//     } catch (error) {
//       console.error('Callback handling failed:', error)
//       return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
//     }
//   }

//   async checkAuthStatus(request: NextRequest) {
//     try {
//       const token = request.cookies.get('auth_token')?.value
      
//       if (!token) {
//         return NextResponse.json({ authenticated: false })
//       }
      
//       const payload = AuthUtils.verifyJWT(token)
//       const isValid = await googleDriveService.validateTokens(payload.tokens)
      
//       return NextResponse.json({ authenticated: isValid })
//     } catch (error) {
//       console.error('Auth status check failed:', error)
//       return NextResponse.json({ authenticated: false })
//     }
//   }
// }

// export const authController = new AuthController()