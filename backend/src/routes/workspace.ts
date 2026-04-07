import express from 'express';
import Joi from 'joi';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';

const router = express.Router();

const workspaceSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(200).allow('').default(''),
});

const channelSchema = Joi.object({
  name: Joi.string().alphanum().min(2).max(30).lowercase().required(),
  description: Joi.string().max(200).allow('').default(''),
  type: Joi.string().valid('PUBLIC', 'PRIVATE').default('PUBLIC'),
});

// GET /api/workspaces — list workspaces the user belongs to
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: req.user!.id
          }
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
                status: true
              }
            }
          }
        },
        channels: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            members: true,
            channels: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { workspaces }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/workspaces — create a workspace
router.post('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = workspaceSchema.validate(req.body);
    if (error) return next(createError(error.details[0].message, 400));

    // Create workspace with default channels
    const workspace = await prisma.workspace.create({
      data: {
        name: value.name,
        description: value.description,
        ownerId: req.user!.id,
        members: {
          create: {
            userId: req.user!.id,
            role: 'admin'
          }
        },
        channels: {
          create: [
            {
              name: 'general',
              description: 'General discussion',
              type: 'PUBLIC',
              createdBy: req.user!.id,
              members: {
                create: {
                  userId: req.user!.id
                }
              }
            },
            {
              name: 'random',
              description: 'Random conversations',
              type: 'PUBLIC',
              createdBy: req.user!.id,
              members: {
                create: {
                  userId: req.user!.id
                }
              }
            }
          ]
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
                status: true
              }
            }
          }
        },
        channels: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            createdAt: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      data: { workspace }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/workspaces/:id — get workspace details
router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        members: {
          some: {
            userId: req.user!.id
          }
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
                status: true
              }
            }
          }
        },
        channels: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            createdAt: true
          }
        }
      }
    });

    if (!workspace) {
      return next(createError('Workspace not found', 404));
    }

    res.json({
      success: true,
      data: { workspace }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/workspaces/:id/channels — create a channel
router.post('/:id/channels', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = channelSchema.validate(req.body);
    if (error) return next(createError(error.details[0].message, 400));

    // Check if user is member of workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: id,
        userId: req.user!.id
      }
    });

    if (!membership) {
      return next(createError('Access denied', 403));
    }

    // Check if channel name already exists in workspace
    const existingChannel = await prisma.channel.findFirst({
      where: {
        workspaceId: id,
        name: value.name
      }
    });

    if (existingChannel) {
      return next(createError('Channel name already exists', 409));
    }

    const channel = await prisma.channel.create({
      data: {
        workspaceId: id,
        name: value.name,
        description: value.description,
        type: value.type,
        createdBy: req.user!.id,
        members: {
          create: {
            userId: req.user!.id
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
                status: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Channel created successfully',
      data: { channel }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/workspaces/:id/join — join a workspace
router.post('/:id/join', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id }
    });

    if (!workspace) {
      return next(createError('Workspace not found', 404));
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: req.user!.id
        }
      }
    });

    if (existingMember) {
      return next(createError('Already a member of this workspace', 409));
    }

    // Add user to workspace
    await prisma.workspaceMember.create({
      data: {
        workspaceId: id,
        userId: req.user!.id,
        role: 'member'
      }
    });

    // Add user to all public channels
    const publicChannels = await prisma.channel.findMany({
      where: {
        workspaceId: id,
        type: 'PUBLIC'
      }
    });

    for (const channel of publicChannels) {
      await prisma.channelMember.create({
        data: {
          channelId: channel.id,
          userId: req.user!.id
        }
      });
    }

    res.json({
      success: true,
      message: 'Joined workspace successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

