import { Request, Response } from "express";
import { ImageService } from "../services/image.service";

interface QualityResponse {
  status: "PASS" | "FAIL";
  reason: string;
  data: {
    isBlurry: boolean;
    focusScore: number;
    isOverExposed: boolean;
    isUnderExposed: boolean;
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

      if (result.isBlurry || result.isOverExposed || result.isUnderExposed) {
        status = "FAIL";
        const issues = [];
        if (result.isBlurry) issues.push("blurry");
        if (result.isOverExposed) issues.push("overexposed");
        if (result.isUnderExposed) issues.push("underexposed");
        reason = `Image quality issues detected: ${issues.join(", ")}`;
      }

      const response: QualityResponse = {
        status,
        reason,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to process image" });
    }
  }
}
