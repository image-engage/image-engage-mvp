// src/types/express.d.ts
import { Request } from 'express';

// Define the shape of your custom property
interface PracticeContext {
  practiceId: string;
}

// Extend the Request interface in the Express namespace
declare global {
  namespace Express {
    interface Request {
      practice?: PracticeContext;
    }
  }
}