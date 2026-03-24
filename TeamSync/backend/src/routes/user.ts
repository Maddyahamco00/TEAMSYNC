import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Temporary in-memory storage (replace with database)
const users: any[] = [];

// Get current user profile
router.get('/profile', authenticateToken, (req: AuthRequest, res, next) => {
  try {
    const user = users.find(u => u.id === req.user?.id);
    if (!user) {
      return next(createError('User not found', 404));
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticateToken, (req: AuthRequest, res, next) => {
  try {
    const user = users.find(u => u.id === req.user?.id);
    if (!user) {
      return next(createError('User not found', 404));
    }

    const { fullName, avatar, status } = req.body;

    if (fullName) user.fullName = fullName;
    if (avatar) user.avatar = avatar;
    if (status) user.status = status;
    user.updatedAt = new Date();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all users (for mentions, etc.)
router.get('/', authenticateToken, (req: AuthRequest, res, next) => {
  try {
    const userList = users.map(user => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      status: user.status
    }));

    res.json({
      success: true,
      data: userList
    });
  } catch (error) {
    next(error);
  }
});

export default router;