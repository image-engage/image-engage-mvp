import { supabase } from '../config/database';
import { Buffer } from 'buffer';

// Default AI prompt for dental collages
const DEFAULT_DENTAL_PROMPT = `Create a professional dental before-and-after collage from the two attached images. Place the 'before' photo on the left and the 'after' photo on the right. Add a clean, professional-looking logo of a dental practice at the bottom center of the collage. The logo should be well-integrated and not obstruct the view of the teeth.`;

/**
 * Service class to handle all collage-related business logic.
 */
export class CollageService {
  static async getCollages() {
    const { data, error } = await supabase
      .from('collages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error in service:', error);
      throw new Error('Failed to fetch collages');
    }

    return data || [];
  }

  static async createCollage({ beforeImage, afterImage, customPrompt }: {
    beforeImage: any; // Using 'any' for file object, which depends on middleware
    afterImage: any;
    customPrompt: string;
  }) {
    // Validate required files
    if (!beforeImage || !afterImage) {
      throw new Error('Both before and after images are required');
    }

    // Validate file types
    if (!beforeImage.mimetype.startsWith('image/') || !afterImage.mimetype.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Generate unique identifiers
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const uniqueId = `${timestamp}-${randomId}`;

    // Upload before image to Supabase Storage
    const beforeImageBuffer = beforeImage.buffer;
    const beforeFileName = `before-${uniqueId}.${beforeImage.mimetype.split('/')[1]}`;
    
    const { error: beforeError } = await supabase.storage
      .from('dental-images')
      .upload(beforeFileName, beforeImageBuffer, {
        contentType: beforeImage.mimetype,
        upsert: false
      });

    if (beforeError) {
      console.error('Before image upload error:', beforeError);
      throw new Error('Failed to upload before image');
    }

    // Upload after image to Supabase Storage
    const afterImageBuffer = afterImage.buffer;
    const afterFileName = `after-${uniqueId}.${afterImage.mimetype.split('/')[1]}`;
    
    const { error: afterError } = await supabase.storage
      .from('dental-images')
      .upload(afterFileName, afterImageBuffer, {
        contentType: afterImage.mimetype,
        upsert: false
      });

    if (afterError) {
      console.error('After image upload error:', afterError);
      throw new Error('Failed to upload after image');
    }

    // Get public URLs for the uploaded images
    const { data: beforeUrl } = supabase.storage
      .from('dental-images')
      .getPublicUrl(beforeFileName);

    const { data: afterUrl } = supabase.storage
      .from('dental-images')
      .getPublicUrl(afterFileName);

    // Use Google Gemini API to generate collage
    const aiPrompt = customPrompt?.trim() || DEFAULT_DENTAL_PROMPT;

    try {
      // For a real implementation, you would process the Gemini response
      // and generate an actual collage image.
      const mockCollageUrl = `https://via.placeholder.com/800x400/f0f0f0/333333?text=Dental+Collage+${uniqueId}`;
      const collageUrl = mockCollageUrl;

      // Save collage data to database
      const { data: newCollage, error: dbError } = await supabase
        .from('collages')
        .insert({
          before_image_url: beforeUrl.publicUrl,
          after_image_url: afterUrl.publicUrl,
          collage_url: collageUrl,
          ai_prompt: aiPrompt,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error('Failed to save collage data');
      }

      return {
        id: newCollage.id,
        beforeImageUrl: newCollage.before_image_url,
        afterImageUrl: newCollage.after_image_url,
        collageUrl: newCollage.collage_url,
        aiPrompt: newCollage.ai_prompt,
        createdAt: newCollage.created_at
      };

    } catch (apiError) {
      console.error('AI API or image processing error:', apiError);
      throw new Error('Failed to generate collage with AI');
    }
  }
}
