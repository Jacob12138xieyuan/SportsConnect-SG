import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from './models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const router = Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  console.log('Registration attempt:', { email: req.body.email, name: req.body.name });
  
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    console.log('Missing fields:', { email: !!email, password: !!password, name: !!name });
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Email already exists:', email);
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Creating user with email:', email);
    
    const user = await User.create({ email, passwordHash, name });
    console.log('User created successfully:', user._id);
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
});

// Google Auth
router.post('/google', async (req: Request, res: Response) => {
  const { email, name, googleId } = req.body;
  if (!email || !name || !googleId) return res.status(400).json({ error: 'Missing Google info' });
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, name, googleId });
  } else if (!user.googleId) {
    user.googleId = googleId;
    await user.save();
  }
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
});

// JWT Middleware
export function requireAuth(req: Request & { userId?: string }, res: Response, next: NextFunction) {
  console.log('Auth middleware called for:', req.method, req.path);

  const auth = req.headers.authorization;
  if (!auth) {
    console.log('No authorization header found');
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const payload = jwt.verify(auth.split(' ')[1], JWT_SECRET) as JwtPayload;
    req.userId = payload.userId as string;
    console.log('Auth successful for user:', req.userId);
    next();
  } catch (err) {
    console.log('Token verification failed:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Get current user
router.get('/me', requireAuth, async (req: Request & { userId?: string }, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user._id, email: user.email, name: user.name });
});

// Update user profile endpoint
router.put('/profile', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { name, email } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update allowed fields
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    // Return updated user without password
    const updatedUser = user.toObject();
    delete updatedUser.passwordHash;

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;