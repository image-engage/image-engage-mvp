import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);

  // Handle Multer errors
  if (error.message.includes('File too large')) {
    res.status(413).json({
      success: false,
      message: 'File too large',
      message2: 'File size exceeds the maximum allowed limit of 50MB',
      error: 'FILE_TOO_LARGE'
    } as ApiResponse);
    return;
  }

  if (error.message.includes('File type') && error.message.includes('not allowed')) {
    res.status(400).json({
      success: false,
      message: 'Invalid file type',
      message2: error.message,
      error: 'INVALID_FILE_TYPE'
    } as ApiResponse);
    return;
  }

  // Handle other errors
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    message2: 'An unexpected error occurred while processing your request',
    error: 'INTERNAL_ERROR'
  } as ApiResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    message2: `The requested endpoint ${req.method} ${req.path} was not found`,
    error: 'NOT_FOUND'
  } as ApiResponse);
};