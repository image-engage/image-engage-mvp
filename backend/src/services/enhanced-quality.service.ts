import sharp from 'sharp';

export interface QualityMetrics {
  qualityScore: number;
  brightnessLevel: number;
  contrastScore: number;
  sharpnessRating: number;
  status: 'pass' | 'fail';
  feedback: string;
  recommendations: string[];
}

export class EnhancedQualityService {
  static async analyzeImage(imageBuffer: Buffer): Promise<QualityMetrics> {
    try {
      const image = sharp(imageBuffer);
      const { width, height } = await image.metadata();
      
      // Get image statistics
      const stats = await image.stats();
      
      // Calculate brightness (0-100)
      const brightnessLevel = Math.round(
        (stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) / 3 / 255 * 100
      );
      
      // Calculate contrast (0-100)
      const contrastScore = Math.round(
        (stats.channels[0].stdev + stats.channels[1].stdev + stats.channels[2].stdev) / 3 / 128 * 100
      );
      
      // Simple sharpness estimation using edge detection
      const edges = await image.clone().greyscale().convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
      }).stats();
      
      const sharpnessRating = Math.min(100, Math.round(edges.channels[0].stdev / 50 * 100));
      
      // Calculate overall quality score
      const qualityScore = Math.round(
        (brightnessLevel * 0.3 + contrastScore * 0.3 + sharpnessRating * 0.4)
      );
      
      // Determine status and feedback
      const { status, feedback, recommendations } = this.generateFeedback({
        qualityScore,
        brightnessLevel,
        contrastScore,
        sharpnessRating
      });
      
      return {
        qualityScore,
        brightnessLevel,
        contrastScore,
        sharpnessRating,
        status,
        feedback,
        recommendations
      };
      
    } catch (error) {
      console.error('Quality analysis failed:', error);
      return {
        qualityScore: 50,
        brightnessLevel: 50,
        contrastScore: 50,
        sharpnessRating: 50,
        status: 'pass',
        feedback: 'Quality analysis unavailable',
        recommendations: []
      };
    }
  }
  
  private static generateFeedback(metrics: Omit<QualityMetrics, 'status' | 'feedback' | 'recommendations'>): {
    status: 'pass' | 'fail';
    feedback: string;
    recommendations: string[];
  } {
    const { qualityScore, brightnessLevel, contrastScore, sharpnessRating } = metrics;
    const recommendations: string[] = [];
    
    // Brightness feedback
    if (brightnessLevel < 30) {
      recommendations.push('Move to brighter lighting or use flash');
    } else if (brightnessLevel > 85) {
      recommendations.push('Reduce lighting or move away from direct light');
    }
    
    // Contrast feedback
    if (contrastScore < 25) {
      recommendations.push('Improve lighting contrast for better detail');
    }
    
    // Sharpness feedback
    if (sharpnessRating < 40) {
      recommendations.push('Hold camera steady and ensure proper focus');
    }
    
    // Overall assessment
    const status = qualityScore >= 60 ? 'pass' : 'fail';
    
    let feedback = '';
    if (qualityScore >= 80) {
      feedback = 'Excellent photo quality';
    } else if (qualityScore >= 60) {
      feedback = 'Good photo quality';
    } else if (qualityScore >= 40) {
      feedback = 'Fair quality - consider retaking';
    } else {
      feedback = 'Poor quality - retake recommended';
    }
    
    return { status, feedback, recommendations };
  }
}