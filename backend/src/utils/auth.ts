// import jwt from 'jsonwebtoken'
// import { GoogleDriveAuth } from '../types'

// export class AuthUtils {
//   private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
  
//   static generateJWT(payload: { tokens: GoogleDriveAuth }): string {
//     return jwt.sign(payload, this.JWT_SECRET, { expiresIn: '7d' })
//   }
  
//   static verifyJWT(token: string): { tokens: GoogleDriveAuth } {
//     try {
//       return jwt.verify(token, this.JWT_SECRET) as { tokens: GoogleDriveAuth }
//     } catch (error) {
//       throw new Error('Invalid authentication token')
//     }
//   }
// }