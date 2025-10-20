import Joi from 'joi';
import { ValidationError } from '../types';

const uploadSchema = Joi.object({
  practiceId: Joi.string().required().min(1).max(50),
  patientId: Joi.string().required().min(1).max(100),
  patientPhotoId: Joi.string().required().min(1).max(100),
  categories: Joi.array().items(
    Joi.string().valid('before', 'after', 'other')
  ).required(),
  mediaTypes: Joi.array().items(
    Joi.string().required()
  ).required()
});

export const validateUploadRequest = (data: any): ValidationError[] => {
  const { error } = uploadSchema.validate(data, { abortEarly: false });
  
  if (!error) return [];
  
  return error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message
  }));
};

export const validateFileArrays = (
  files: Express.Multer.File[], 
  categories: string[], 
  mediaTypes: string[]
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!files || files.length === 0) {
    errors.push({ field: 'files', message: 'At least one file is required' });
    return errors;
  }
  
  if (files.length !== categories.length) {
    errors.push({ 
      field: 'categories', 
      message: 'Number of categories must match number of files' 
    });
  }
  
  if (files.length !== mediaTypes.length) {
    errors.push({ 
      field: 'mediaTypes', 
      message: 'Number of mediaTypes must match number of files' 
    });
  }
  
  return errors;
};