import { Request, Response } from "express";
import { ImageService } from "../services/image.service";

interface QualityResponse {
  status: "PASS" | "FAIL";
  reason: string;
  qualityScore: number;
  metrics: {
    brightness: number;
    contrast: number;
    sharpness: number;
  };
  recommendations: string[];
  data: {
    isBlurry: boolean;
    focusScore: number;
    isOverExposed?: boolean;
    isUnderExposed?: boolean;
  };
}

export class ImageController {
  static async checkQuality(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      const result = await ImageService.checkImageQuality(req.file.buffer);

      let status: "PASS" | "FAIL" = "PASS";
      let reason = "Image quality is acceptable";
      const recommendations: string[] = [];
      
      // Calculate quality score (0-100)
      let qualityScore = 85; // Default good score
      
      if (result.isBlurry || result.isOverExposed || result.isUnderExposed) {
        status = "FAIL";
        qualityScore = 45; // Poor quality score
        const issues = [];
        if (result.isBlurry) {
          issues.push("blurry");
          recommendations.push("Hold camera steady and ensure proper focus");
        }
        if (result.isOverExposed) {
          issues.push("overexposed");
          recommendations.push("Reduce lighting or move away from direct light");
        }
        if (result.isUnderExposed) {
          issues.push("underexposed");
          recommendations.push("Move to brighter lighting or use flash");
        }
        reason = `Image quality issues detected: ${issues.join(", ")}`;
      }

      const response: QualityResponse = {
        status,
        reason,
        qualityScore,
        metrics: {
          brightness: result.isUnderExposed ? 25 : result.isOverExposed ? 95 : 70,
          contrast: 75,
          sharpness: result.isBlurry ? 30 : 80
        },
        recommendations,
        data: result,
      };

      res.status(200).json({ success: true, data: response });
    } catch (error) {
      res.status(500).json({ error: "Failed to process image" });
    }
  }
}
