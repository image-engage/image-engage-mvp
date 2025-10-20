import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { ApiResponse } from '../types';

export const generateQRToken = async (req: Request, res: Response) => {
  try {
    const { expiresIn = 60 } = req.body; // Default 60 seconds
    const practiceId = req.user?.practiceId;
    const userId = req.user?.userId;

    if (!practiceId || !userId) {
      return res.status(401).json({ success: false, message2: 'Authentication required.' });
    }

    // Generate secure token
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + (expiresIn * 1000));

    // Store token in database
    const { data, error } = await supabase
      .from('session_tokens')
      .insert({
        session_token: sessionToken,
        practice_id: practiceId,
        created_by: userId,
        expires_at: expiresAt.toISOString(),
      })
      .select('session_token, expires_at')
      .single();

    if (error) {
      console.error('Error generating QR token:', error);
      return res.status(500).json({ success: false, message2: 'Failed to generate secure token' });
    }

    res.json({
      success: true,
      data: {
        sessionToken: data.session_token,
        expiresAt: data.expires_at
      }
    });

  } catch (error) {
    console.error('Error generating QR token:', error);
    res.status(500).json({ success: false, message2: 'Internal server error' });
  }
};

export const validateToken = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message2: 'Token is required'
      });
    }

    // Query token with practice info
    const { data: result, error } = await supabase
      .from('session_tokens')
      .select(`*, practice:practices (id, name)`)
      .eq('session_token', token)
      .gt('expires_at', new Date().toISOString())
      .eq('is_used', false)
      .single();

    if (error || !result) {
      return res.status(404).json({
        success: false,
        message2: 'Invalid or expired token'
      });
    }

    const session = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        practice: {
          id: result.practice.id,
          name: result.practice.name
        },
        sessionToken: token,
        expiresAt: result.expires_at
      }
    });

  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ success: false, message2: 'Failed to validate token' });
  }
};

export const markTokenUsed = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message2: 'Token is required' });
    }

    const { data, error, count } = await supabase
      .from('session_tokens')
      .update({ is_used: true, updated_at: new Date().toISOString() })
      .eq('session_token', token)
      .select();

    if (error) {
      console.error('Error marking token as used:', error);
      return res.status(500).json({ success: false, message2: 'Failed to mark token as used' });
    }

    res.status(200).json({
      success: true,
      message2: count && count > 0 ? 'Token marked as used.' : 'Token not found or already used.',
      data: { tokenMarked: count ? count > 0 : false }
    });

  } catch (error) {
    console.error('Error marking token as used:', error);
    res.status(500).json({ success: false, message2: 'Internal server error' });
  }
};