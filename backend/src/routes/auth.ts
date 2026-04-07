import express from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import Joi from 'joi';
import { createError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { type AuthRequest } from '../middleware/auth';

const router = express.Router();

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
};

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).max(50).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return next(createError(error.details[0].message, 400));
    }

    const { username, email, password, fullName } = value;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return next(createError('User already exists', 409));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        fullName,
        status: 'online'
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

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, token }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return next(createError(error.details[0].message, 400));
    }

    const { email, password } = value;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return next(createError('Invalid credentials', 401));
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return next(createError('Invalid credentials', 401));
    }

    // Update user status to online
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'online' }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      status: 'online',
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userResponse, token }
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', async (req: AuthRequest, res, next) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can update user status if we have user info from middleware
    const userId = req.user?.id;
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'offline' }
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(createError('Unauthorized', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

export default router;