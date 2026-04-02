import express from 'express';
import Joi from 'joi';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { messages, channels, users, generateId } from '../store/memoryStore';

const router = express.Router();

const messageSchema = Joi.object({
  content: Joi.string().min(1).max(4000).required(),
});

// GET /api/messages/channel/:channelId?page=1&limit=50
router.get('/channel/:channelId', authenticateToken, (req: AuthRequest, res, next) => {
  const channel = channels.find(c => c.id === req.params.channelId);
  if (!channel) return next(createError('Channel not found', 404));
  if (!channel.members.includes(req.user!.id)) return next(createError('Access denied', 403));

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

  const channelMessages = messages
    .filter(m => m.channelId === req.params.channelId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const total = channelMessages.length;
  const paginated = channelMessages.slice((page - 1) * limit, page * limit);

  res.json({
    success: true,
    data: paginated,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

// POST /api/messages/channel/:channelId — send a message via REST
router.post('/channel/:channelId', authenticateToken, (req: AuthRequest, res, next) => {
  const channel = channels.find(c => c.id === req.params.channelId);
  if (!channel) return next(createError('Channel not found', 404));
  if (!channel.members.includes(req.user!.id)) return next(createError('Access denied', 403));

  const { error, value } = messageSchema.validate(req.body);
  if (error) return next(createError(error.details[0].message, 400));

  const sender = users.find(u => u.id === req.user!.id);
  const message = {
    id: generateId(),
    content: value.content.trim(),
    userId: req.user!.id,
    username: sender?.username || req.user!.username,
    channelId: req.params.channelId,
    edited: false,
    createdAt: new Date(),
  };
  messages.push(message);

  res.status(201).json({ success: true, data: message });
});

// PATCH /api/messages/:messageId — edit a message
router.patch('/:messageId', authenticateToken, (req: AuthRequest, res, next) => {
  const message = messages.find(m => m.id === req.params.messageId);
  if (!message) return next(createError('Message not found', 404));
  if (message.userId !== req.user!.id) return next(createError('Cannot edit another user\'s message', 403));

  const { error, value } = messageSchema.validate(req.body);
  if (error) return next(createError(error.details[0].message, 400));

  message.content = value.content.trim();
  message.edited = true;
  message.editedAt = new Date();

  res.json({ success: true, data: message });
});

// DELETE /api/messages/:messageId
router.delete('/:messageId', authenticateToken, (req: AuthRequest, res, next) => {
  const idx = messages.findIndex(m => m.id === req.params.messageId);
  if (idx === -1) return next(createError('Message not found', 404));
  if (messages[idx].userId !== req.user!.id) return next(createError('Cannot delete another user\'s message', 403));

  messages.splice(idx, 1);
  res.json({ success: true, message: 'Message deleted' });
});

export default router;
