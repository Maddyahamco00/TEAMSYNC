import express from 'express';
import Joi from 'joi';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';

const router = express.Router();

const messageSchema = Joi.object({
  content: Joi.string().min(1).max(4000).required(),
});

// GET /api/messages/search?q=term&workspaceId=id
router.get('/search', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const q = (req.query.q as string || '').trim().toLowerCase();
    const workspaceId = req.query.workspaceId as string;

    if (!q) return next(createError('Search query required', 400));

    // Get channels the user has access to
    const accessibleChannels = await prisma.channelMember.findMany({
      where: {
        userId: req.user!.id,
        channel: workspaceId ? {
          workspaceId
        } : undefined
      },
      select: {
        channelId: true
      }
    });

    const channelIds = accessibleChannels.map(ac => ac.channelId);

    const messages = await prisma.message.findMany({
      where: {
        channelId: {
          in: channelIds
        },
        content: {
          contains: q,
          mode: 'insensitive'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            workspaceId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 30
    });

    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/messages/channel/:channelId?page=1&limit=50
router.get('/channel/:channelId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { channelId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

    // Check if user has access to channel
    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: req.user!.id
      }
    });

    if (!channelMember) {
      return next(createError('Access denied', 403));
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { channelId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true
            }
          },
          fileUploads: {
            select: {
              id: true,
              filename: true,
              originalName: true,
              mimeType: true,
              size: true,
              url: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.message.count({
        where: { channelId }
      })
    ]);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/messages/channel/:channelId
router.post('/channel/:channelId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { channelId } = req.params;
    const { error, value } = messageSchema.validate(req.body);
    if (error) return next(createError(error.details[0].message, 400));

    // Check if user has access to channel
    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: req.user!.id
      }
    });

    if (!channelMember) {
      return next(createError('Access denied', 403));
    }

    // Get user info for the message
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        username: true,
        fullName: true
      }
    });

    if (!user) {
      return next(createError('User not found', 404));
    }

    const message = await prisma.message.create({
      data: {
        content: value.content,
        userId: req.user!.id,
        username: user.username,
        channelId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true
          }
        },
        fileUploads: true
      }
    });

    res.status(201).json({
      success: true,
      data: { message }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/messages/:id
router.put('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = messageSchema.validate(req.body);
    if (error) return next(createError(error.details[0].message, 400));

    // Find message and check ownership
    const message = await prisma.message.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!message) {
      return next(createError('Message not found or access denied', 404));
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        content: value.content,
        edited: true,
        editedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { message: updatedMessage }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/messages/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Find message and check ownership
    const message = await prisma.message.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!message) {
      return next(createError('Message not found or access denied', 404));
    }

    await prisma.message.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

// done