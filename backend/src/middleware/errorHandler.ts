import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      error: 'File too large'
    });
    return;
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(400).json({
      success: false,
      error: 'Unexpected file field'
    });
    return;
  }

  // Validation errors
  if (error.isJoi) {
    res.status(400).json({
      success: false,
      error: error.details[0].message
    });
    return;
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
};