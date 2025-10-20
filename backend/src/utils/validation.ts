import { PublishConfig } from '../types'

export class ValidationUtils {
  static validatePublishConfig(config: PublishConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!config.folderId || config.folderId.trim().length === 0) {
      errors.push('Folder ID is required')
    }
    
    if (config.caption && config.caption.length > 2200) {
      errors.push('Caption must be less than 2200 characters')
    }
    
    if (config.tags && config.tags.length > 30) {
      errors.push('Maximum 30 tags allowed')
    }
    
    if (config.scheduleTime) {
      const scheduleDate = new Date(config.scheduleTime)
      if (scheduleDate <= new Date()) {
        errors.push('Schedule time must be in the future')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  static validatePhotoIds(photoIds: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      errors.push('At least one photo must be selected')
    }
    
    if (photoIds && photoIds.length > 10) {
      errors.push('Maximum 10 photos can be published at once')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}