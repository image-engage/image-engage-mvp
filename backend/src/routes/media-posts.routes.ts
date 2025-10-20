import { Router } from 'express';
import { MediaPostsController } from '../controllers/media-posts.controller';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, AuthRequest } from '../types';


const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /media-posts - Get all media posts with filtering
router.get('/',MediaPostsController.getAllMediaPosts);

// GET /media-posts/:id - Get a specific media post by ID
router.get('/:id',MediaPostsController.getMediaPostById);

// PUT /media-posts/:id - Update a media post (status, caption, hashtags, platforms)
router.put('/:id',MediaPostsController.updateMediaPost);

router.post('/',MediaPostsController.createMediaPost);

// PUT /media-posts/bulk/status - Bulk update status for multiple posts
router.put('/bulk/status',MediaPostsController.bulkUpdateStatus);

// DELETE /media-posts/:id - Delete a media post
router.delete('/:id',MediaPostsController.deleteMediaPost);

export default router;