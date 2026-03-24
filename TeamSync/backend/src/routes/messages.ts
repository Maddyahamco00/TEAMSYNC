import express from 'express';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get channel messages
router.get('/channel/:channelId', auth, async (req, res) => {
  try {
    // Mock messages for now
    const messages = [
      {
        id: '1',
        content: 'Welcome to TeamSync! 🎉',
        userId: 'system',
        username: 'TeamSync Bot',
        channelId: req.params.channelId,
        timestamp: new Date(Date.now() - 3600000),
        edited: false
      }
    ];
    
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

export default router;