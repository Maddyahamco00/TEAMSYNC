import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        avatar: true,
        status: true,
        createdAt: true
      }
    });

    if (!user) {
      return next(createError('User not found', 404));
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { fullName, avatar, status } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(fullName && { fullName }),
        ...(avatar !== undefined && { avatar }),
        ...(status && { status })
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        avatar: true,
        status: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// Get user status
router.get('/status/:userId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        status: true
      }
    });

    if (!user) {
      return next(createError('User not found', 404));
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// Get all users (for mentions, etc.)
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
        status: true
      },
      orderBy: { username: 'asc' }
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
