import express from 'express';
import Joi from 'joi';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { workspaces, channels, generateId } from '../store/memoryStore';

const router = express.Router();

const workspaceSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(200).allow('').default(''),
});

const channelSchema = Joi.object({
  name: Joi.string().alphanum().min(2).max(30).lowercase().required(),
  description: Joi.string().max(200).allow('').default(''),
  type: Joi.string().valid('public', 'private').default('public'),
});

// GET /api/workspaces — list workspaces the user belongs to
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const userWorkspaces = workspaces.filter(w => w.members.includes(req.user!.id));
  res.json({ success: true, data: userWorkspaces });
});

// POST /api/workspaces — create a workspace
router.post('/', authenticateToken, (req: AuthRequest, res, next) => {
  const { error, value } = workspaceSchema.validate(req.body);
  if (error) return next(createError(error.details[0].message, 400));

  const workspace = {
    id: generateId(),
    name: value.name,
    description: value.description,
    ownerId: req.user!.id,
    members: [req.user!.id],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  workspaces.push(workspace);

  // Auto-create #general and #random channels
  const defaultChannels = ['general', 'random'];
  defaultChannels.forEach(name => {
    channels.push({
      id: generateId(),
      workspaceId: workspace.id,
      name,
      description: name === 'general' ? 'General discussion' : 'Random conversations',
      type: 'public',
      createdBy: req.user!.id,
      members: [req.user!.id],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  res.status(201).json({ success: true, data: workspace });
});

// GET /api/workspaces/:workspaceId/channels
router.get('/:workspaceId/channels', authenticateToken, (req: AuthRequest, res, next) => {
  const workspace = workspaces.find(w => w.id === req.params.workspaceId);
  if (!workspace) return next(createError('Workspace not found', 404));
  if (!workspace.members.includes(req.user!.id)) return next(createError('Access denied', 403));

  const workspaceChannels = channels.filter(c =>
    c.workspaceId === req.params.workspaceId &&
    (c.type === 'public' || c.members.includes(req.user!.id))
  );
  res.json({ success: true, data: workspaceChannels });
});

// POST /api/workspaces/:workspaceId/channels — create a channel
router.post('/:workspaceId/channels', authenticateToken, (req: AuthRequest, res, next) => {
  const workspace = workspaces.find(w => w.id === req.params.workspaceId);
  if (!workspace) return next(createError('Workspace not found', 404));
  if (!workspace.members.includes(req.user!.id)) return next(createError('Access denied', 403));

  const { error, value } = channelSchema.validate(req.body);
  if (error) return next(createError(error.details[0].message, 400));

  const exists = channels.find(c => c.workspaceId === req.params.workspaceId && c.name === value.name);
  if (exists) return next(createError('Channel name already exists in this workspace', 409));

  const channel = {
    id: generateId(),
    workspaceId: req.params.workspaceId,
    name: value.name,
    description: value.description,
    type: value.type as 'public' | 'private',
    createdBy: req.user!.id,
    members: [req.user!.id],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  channels.push(channel);

  res.status(201).json({ success: true, data: channel });
});

// POST /api/workspaces/:workspaceId/channels/:channelId/join
router.post('/:workspaceId/channels/:channelId/join', authenticateToken, (req: AuthRequest, res, next) => {
  const workspace = workspaces.find(w => w.id === req.params.workspaceId);
  if (!workspace) return next(createError('Workspace not found', 404));
  if (!workspace.members.includes(req.user!.id)) return next(createError('Access denied', 403));

  const channel = channels.find(c => c.id === req.params.channelId && c.workspaceId === req.params.workspaceId);
  if (!channel) return next(createError('Channel not found', 404));
  if (channel.type === 'private' && !channel.members.includes(req.user!.id)) {
    return next(createError('Cannot join private channel without invite', 403));
  }

  if (!channel.members.includes(req.user!.id)) {
    channel.members.push(req.user!.id);
    channel.updatedAt = new Date();
  }

  res.json({ success: true, data: channel });
});

// POST /api/workspaces/:workspaceId/join — join a workspace
router.post('/:workspaceId/join', authenticateToken, (req: AuthRequest, res, next) => {
  const workspace = workspaces.find(w => w.id === req.params.workspaceId);
  if (!workspace) return next(createError('Workspace not found', 404));

  if (!workspace.members.includes(req.user!.id)) {
    workspace.members.push(req.user!.id);
    workspace.updatedAt = new Date();

    // Auto-join all public channels
    channels
      .filter(c => c.workspaceId === workspace.id && c.type === 'public')
      .forEach(c => { if (!c.members.includes(req.user!.id)) c.members.push(req.user!.id); });
  }

  res.json({ success: true, data: workspace });
});

export default router;
