import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';

const router = express.Router();

// GET /api/notifications
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      include: {
        message: {
          select: {
            id: true,
            content: true,
            createdAt: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read — mark all as read
router.patch('/read', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        read: false
      },
      data: { read: true }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read — mark specific notification as read
router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!notification) {
      return next(createError('Notification not found', 404));
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id — delete a notification
router.delete('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!notification) {
      return next(createError('Notification not found', 404));
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
