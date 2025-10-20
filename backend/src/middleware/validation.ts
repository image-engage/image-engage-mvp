import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import Joi from 'joi';

export const validatePracticeRegistration = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const { name, email, password } = req.body;
console.log('BODY:', req.body)
  if (!name || !email || !password) {
    res.status(400).json({
      success: false,
      message2: 'Name, email, and password are required'
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({
      success: false,
      message2: 'Password must be at least 8 characters long'
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message2: 'Please provide a valid email address'
    });
    return;
  }

  next();
};

export const validateUserRegistration = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const { firstName, lastName, email, password } = req.body;
console.log('BODY:', req.body)
  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({
      success: false,
      message2: 'First Name, Last Name, email, and password are required'
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({
      success: false,
      message2: 'Password must be at least 8 characters long'
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message2: 'Please provide a valid email address'
    });
    return;
  }

  next();
};

export const validatePatientConsent = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const { firstName, lastName, email, phone, procedure, consentDate } = req.body;
console.log('BODY:', req.body)
  if (!firstName || !lastName || !email || !phone || !procedure || !consentDate) {
    res.status(400).json({
      success: false,
      message2: 'First name, last name, email, phone, consent date, and procedure are required'
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message2: 'Please provide a valid email address'
    });
    return;
  }

  next();
};

export const validateConsentForm = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const { firstName, lastName, email, phone, procedure, consentDate } = req.body;

  if (!firstName || !lastName || !email || !phone || !procedure || !consentDate) {
    res.status(400).json({
      success: false,
      message2: 'First name, last name, email, phone, consent date, and procedure  are required'
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message2: 'Please provide a valid email address'
    });
    return;
  }

  next();
};

export const validatePracticeId = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const practiceId = req.headers['x-practice-id'] as string;
  
  if (!practiceId) {
    res.status(401).json({
      success: false,
      error: 'Missing Practice ID in headers'
    });
    return;
  }

  if (typeof practiceId !== 'string' || practiceId.trim().length === 0) {
    res.status(401).json({
      success: false,
      error: 'Invalid Practice ID format'
    });
    return;
  }

  // Attach practice context to request
  //req.practice = { practiceId: practiceId.trim() };
  next();
};


const patientIdSchema = Joi.string()
  .alphanum()
  .min(1)
  .max(50)
  .required()
  .messages({
    'string.alphanum': 'Patient ID must contain only alphanumeric characters',
    'string.min': 'Patient ID must be at least 1 character long',
    'string.max': 'Patient ID must be at most 50 characters long',
    'any.required': 'Patient ID is required'
  });