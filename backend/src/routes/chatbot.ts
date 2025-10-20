import express from 'express';
import Joi from 'joi';
import { supabase } from '../config/database';
import { ApiResponse, AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  isActive: boolean;
  priority: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  matchedFaqId?: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

// Validation schemas
const chatMessageSchema = Joi.object({
  message: Joi.string().required().max(500)
});

const faqSchema = Joi.object({
  question: Joi.string().required(),
  answer: Joi.string().required(),
  keywords: Joi.array().items(Joi.string()).default([]),
  category: Joi.string().required(),
  isActive: Joi.boolean().default(true),
  priority: Joi.number().integer().min(1).max(3).default(1)
});

// Enhanced keyword matching function with booking intent detection
const findBestMatch = (message: string, faqs: FAQ[]): { faq: FAQ | null; intent: string | null } => {
  const messageLower = message.toLowerCase();
  const words = messageLower.split(/\s+/);
  
  // Check for booking intent keywords
  const bookingKeywords = [
    'book', 'schedule', 'appointment', 'reserve', 'make appointment',
    'book appointment', 'schedule appointment', 'need appointment',
    'want appointment', 'set up appointment', 'arrange appointment'
  ];
  
  const hasBookingIntent = bookingKeywords.some(keyword => 
    messageLower.includes(keyword.toLowerCase())
  );
  
  if (hasBookingIntent) {
    return { faq: null, intent: 'booking' };
  }
  
  let bestMatch: FAQ | null = null;
  let bestScore = 0;
  
  for (const faq of faqs.filter(f => f.isActive)) {
    let score = 0;
    
    // Check for exact question match (highest priority)
    if (faq.question.toLowerCase().includes(messageLower)) {
      score += 100;
    }
    
    // Check for keyword matches
    for (const keyword of faq.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (messageLower.includes(keywordLower)) {
        score += 10;
      }
      
      // Check for partial word matches
      for (const word of words) {
        if (word.includes(keywordLower) || keywordLower.includes(word)) {
          score += 5;
        }
      }
    }
    
    // Priority bonus (higher priority = lower number = higher bonus)
    score += (4 - faq.priority) * 2;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }
  
  // Only return match if score is above threshold
  return { 
    faq: bestScore >= 5 ? bestMatch : null, 
    intent: null 
  };
};

// Default fallback responses
const fallbackResponses = [
  "I'm sorry, I don't have specific information about that. Please call our office at (555) 123-4567 for assistance.",
  "I couldn't find an answer to your question. Our staff would be happy to help you - please contact us at (555) 123-4567.",
  "That's a great question! For the most accurate information, please call us at (555) 123-4567 or schedule an appointment online."
];

// Booking-specific responses
const bookingResponses = {
  initial: "I'd be happy to help you schedule an appointment! Let me show you our available times. What type of appointment are you looking for?",
  availableSlots: "Here are our available appointment slots:",
  noSlots: "I don't see any available slots for that time. Would you like to see other available times?",
  bookingSuccess: "Great! Your appointment has been scheduled. You'll receive a confirmation email shortly.",
  bookingError: "I'm sorry, there was an issue scheduling your appointment. Please call us at (555) 123-4567 for assistance."
};

// POST /api/chatbot/chat (Public endpoint - no auth required)
router.post('/chat', async (req, res, next): Promise<void> => {
  try {
    const { error: validationError } = chatMessageSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const { message } = req.body;
    
    // Get FAQs from database (or localStorage for demo)
    const { data: faqs, error: faqError } = await supabase
      .from('chatbot_faqs')
      .select('*')
      .eq('isActive', true)
      .order('priority', { ascending: true });

    let activeFaqs: FAQ[] = [];
    
    if (faqError || !faqs) {
      // Fallback to demo data if database is not set up
      activeFaqs = [
        {
          id: '1',
          question: 'What are your office hours?',
          answer: 'Our office is open Monday through Friday from 8:00 AM to 6:00 PM, and Saturdays from 9:00 AM to 3:00 PM. We are closed on Sundays and major holidays.',
          keywords: ['hours', 'open', 'time', 'schedule', 'when'],
          category: 'Location & Hours',
          isActive: true,
          priority: 1,
          createdBy: 'admin',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          question: 'Do you accept new patients?',
          answer: 'Yes, we are currently accepting new patients! We welcome patients of all ages and would be happy to schedule your first appointment. Please call us at (555) 123-4567 or use our online booking system.',
          keywords: ['new patients', 'accepting', 'new', 'appointment'],
          category: 'Appointments',
          isActive: true,
          priority: 1,
          createdBy: 'admin',
          createdAt: '2024-01-14T14:15:00Z',
          updatedAt: '2024-01-14T14:15:00Z'
        },
        {
          id: '3',
          question: 'Where are you located?',
          answer: 'We are located at 123 Main Street, Suite 100, Anytown, ST 12345. We have convenient parking available and are easily accessible by public transportation.',
          keywords: ['location', 'address', 'where', 'directions', 'parking'],
          category: 'Location & Hours',
          isActive: true,
          priority: 1,
          createdBy: 'admin',
          createdAt: '2024-01-13T09:00:00Z',
          updatedAt: '2024-01-13T09:00:00Z'
        },
        {
          id: '4',
          question: 'What insurance do you accept?',
          answer: 'We accept most major dental insurance plans including Delta Dental, Blue Cross Blue Shield, Aetna, Cigna, and MetLife. We also offer flexible payment plans for uninsured patients. Please call us to verify your specific coverage.',
          keywords: ['insurance', 'coverage', 'payment', 'plans', 'accept'],
          category: 'Insurance & Billing',
          isActive: true,
          priority: 1,
          createdBy: 'admin',
          createdAt: '2024-01-12T11:20:00Z',
          updatedAt: '2024-01-12T11:20:00Z'
        },
        {
          id: '5',
          question: 'Do you handle dental emergencies?',
          answer: 'Yes, we provide emergency dental care for urgent situations such as severe tooth pain, broken teeth, or dental trauma. Please call our office immediately at (555) 123-4567. For after-hours emergencies, follow the instructions on our voicemail.',
          keywords: ['emergency', 'urgent', 'pain', 'broken', 'trauma', 'after hours'],
          category: 'Emergency Care',
          isActive: true,
          priority: 2,
          createdBy: 'admin',
          createdAt: '2024-01-11T16:45:00Z',
          updatedAt: '2024-01-11T16:45:00Z'
        }
      ];
    } else {
      activeFaqs = faqs;
    }

    // Find best matching FAQ or detect booking intent
    const { faq: matchedFaq, intent } = findBestMatch(message, activeFaqs);
    
    let response: string;
    let matchedFaqId: string | undefined;
    let actionType: string | undefined;
    let actionData: any = undefined;
    
    if (intent === 'booking') {
      response = bookingResponses.initial;
      actionType = 'show_booking';
      
      // Get available appointment slots for the next 7 days
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const { data: slots, error: slotsError } = await supabase
        .from('appointment_slots')
        .select('*')
        .eq('isAvailable', true)
        .gte('date', startDate)
        .lte('date', endDateStr)
        .order('date', { ascending: true })
        .order('startTime', { ascending: true })
        .limit(10);
      
      if (!slotsError && slots) {
        actionData = {
          availableSlots: slots,
          appointmentTypes: ['consultation', 'cleaning', 'checkup', 'emergency']
        };
      }
    } else if (matchedFaq) {
      response = matchedFaq.answer;
      matchedFaqId = matchedFaq.id;
    } else {
      // Use random fallback response
      response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }

    // Log the chat interaction
    const chatLog: ChatMessage = {
      id: Date.now().toString(),
      message,
      response,
      matchedFaqId,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    };

    // Save to database (or localStorage for demo)
    try {
      await supabase
        .from('chatbot_logs')
        .insert(chatLog);
    } catch (logError) {
      // If database logging fails, continue anyway
      console.error('Failed to log chat interaction:', logError);
    }

    const apiResponse: ApiResponse = {
      success: true,
      data: {
        response,
        actionType,
        actionData,
        matchedFaq: matchedFaq ? {
          id: matchedFaq.id,
          question: matchedFaq.question,
          category: matchedFaq.category
        } : null,
        timestamp: chatLog.timestamp
      }
    };

    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /api/chatbot/book-appointment (Public endpoint)
router.post('/book-appointment', async (req, res, next): Promise<void> => {
  try {
    const bookingSchema = Joi.object({
      patientName: Joi.string().required(),
      patientEmail: Joi.string().email().required(),
      patientPhone: Joi.string().required(),
      appointmentDate: Joi.string().isoDate().required(),
      appointmentTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
      appointmentType: Joi.string().valid('consultation', 'cleaning', 'checkup', 'emergency', 'procedure').default('consultation'),
      notes: Joi.string().allow('').default('')
    });

    const { error: validationError } = bookingSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const appointmentData = {
      ...req.body,
      source: 'chatbot'
    };

    // Check if the requested slot is available
    const { data: slot, error: slotError } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('date', appointmentData.appointmentDate)
      .eq('startTime', appointmentData.appointmentTime)
      .eq('isAvailable', true)
      .single();

    if (slotError || !slot) {
      res.status(400).json({
        success: false,
        error: 'The requested appointment slot is not available',
        data: { response: bookingResponses.noSlots }
      });
      return;
    }

    // Create the appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (appointmentError) {
      throw appointmentError;
    }

    // Mark the slot as unavailable
    const { error: updateError } = await supabase
      .from('appointment_slots')
      .update({ isAvailable: false })
      .eq('id', slot.id);

    if (updateError) {
      // If we can't mark the slot as unavailable, delete the appointment
      await supabase.from('appointments').delete().eq('id', appointment.id);
      throw updateError;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        response: bookingResponses.bookingSuccess,
        appointment: {
          id: appointment.id,
          date: appointment.appointmentDate,
          time: appointment.appointmentTime,
          type: appointment.appointmentType
        }
      },
      message: 'Appointment booked successfully via chatbot'
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to book appointment',
      data: { response: bookingResponses.bookingError }
    });
  }
});

// Protected routes (require authentication)
router.use(authenticateToken);

// GET /api/chatbot/faqs
router.get('/faqs', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { data: faqs, error } = await supabase
      .from('chatbot_faqs')
      .select('*')
      .order('priority', { ascending: true });

    if (error) {
      throw error;
    }

    const response: ApiResponse<FAQ[]> = {
      success: true,
      data: faqs || []
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/chatbot/faqs
router.post('/faqs', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { error: validationError } = faqSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const faqData = {
      ...req.body,
      createdBy: req.user!.id
    };

    const { data: faq, error } = await supabase
      .from('chatbot_faqs')
      .insert(faqData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const response: ApiResponse<FAQ> = {
      success: true,
      data: faq,
      message: 'FAQ created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/chatbot/faqs/:id
router.put('/faqs/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { error: validationError } = faqSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const { data: faq, error } = await supabase
      .from('chatbot_faqs')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const response: ApiResponse<FAQ> = {
      success: true,
      data: faq,
      message: 'FAQ updated successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/chatbot/faqs/:id
router.delete('/faqs/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('chatbot_faqs')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    const response: ApiResponse = {
      success: true,
      message: 'FAQ deleted successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/chatbot/logs
router.get('/logs', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const { data: logs, error, count } = await supabase
      .from('chatbot_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw error;
    }

    const response: ApiResponse<ChatMessage[]> = {
      success: true,
      data: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;