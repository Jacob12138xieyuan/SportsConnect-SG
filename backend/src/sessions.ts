import { Router, Request, Response } from 'express';
import Session from './models/Session';
import { requireAuth } from './auth';
import mongoose from 'mongoose';

const router = Router();

// GET /sessions - list all sessions
router.get('/', async (_req, res) => {
  try {
    const sessions = await Session.find().sort({ date: 1, time: 1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /sessions/:id - get session by id
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate({ path: 'participants', select: 'name avatar email' })
      .populate({ path: 'hostId', select: 'name avatar email' });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// POST /sessions - create a new session
router.post('/', requireAuth, async (req: Request & { userId?: string }, res: Response) => {
  console.log('Session creation attempt:', { 
    sport: req.body.sport, 
    venue: req.body.venue, 
    date: req.body.date,
    hostId: req.userId 
  });
  
  try {
    const sessionData = {
      ...req.body,
      hostId: req.userId,
    };
    const session = new Session(sessionData);
    await session.save();
    console.log('Session created successfully:', session._id);
    res.status(201).json(session);
  } catch (err) {
    console.error('Session creation error:', err);
    res.status(400).json({ error: 'Invalid session data', details: err });
  }
});

// POST /sessions/:id/join - join a session
router.post('/:id/join', requireAuth, async (req: Request & { userId?: string }, res: Response) => {
  console.log('Join session request received:', {
    sessionId: req.params.id,
    userId: req.userId,
    timestamp: new Date().toISOString()
  });

  try {
    // Check if userId exists
    if (!req.userId) {
      console.error('No userId found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('Finding session by ID:', req.params.id);
    const session = await Session.findById(req.params.id);
    if (!session) {
      console.log('Session not found:', req.params.id);
      return res.status(404).json({ error: 'Session not found' });
    }

    const userIdStr = req.userId.toString();
    // Calculate current players dynamically (participants + host if countHostIn)
    const hostCount = session.countHostIn ? 1 : 0;
    const currentPlayers = (session.participants?.length || 0) + hostCount;

    console.log('Session found:', {
      sessionId: session._id,
      currentParticipants: session.participants,
      participantCount: session.participants?.length || 0,
      countHostIn: session.countHostIn,
      hostCount: hostCount,
      currentPlayers: currentPlayers,
      maxPlayers: session.maxPlayers,
      userTryingToJoin: userIdStr
    });

    // Check if user already joined
    if (session.participants && session.participants.map((id: any) => id.toString()).includes(userIdStr)) {
      console.log('User already joined this session');
      return res.status(400).json({ error: 'Already joined' });
    }

    // Check if session is full
    if (currentPlayers >= session.maxPlayers) {
      console.log('Session is full');
      return res.status(400).json({ error: 'Session is full' });
    }

    // Add user to session
    console.log('Adding user to session...');
    session.participants = session.participants || [];

    try {
      session.participants.push(new mongoose.Types.ObjectId(userIdStr));
      console.log('User added to session, saving...');
    } catch (objectIdError) {
      console.error('Error creating ObjectId:', objectIdError);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    console.log('Saving session with new participant:', {
      newParticipants: session.participants,
      countHostIn: session.countHostIn,
      newCurrentPlayers: (session.participants?.length || 0) + (session.countHostIn ? 1 : 0)
    });

    try {
      await session.save();
      console.log('Session saved successfully');
    } catch (saveError) {
      console.error('Error saving session:', saveError);
      return res.status(500).json({ error: 'Failed to save session' });
    }

    console.log('Populating session data...');
    try {
      const populatedSession = await Session.findById(session._id)
        .populate({ path: 'participants', select: 'name avatar email' })
        .populate({ path: 'hostId', select: 'name avatar email' });

      console.log('Join successful, returning populated session:', {
        sessionId: populatedSession?._id,
        participantCount: populatedSession?.participants?.length,
        countHostIn: populatedSession?.countHostIn,
        currentPlayers: (populatedSession?.participants?.length || 0) + (populatedSession?.countHostIn ? 1 : 0)
      });

      res.json(populatedSession);
    } catch (populateError) {
      console.error('Error populating session:', populateError);
      // Return the session without population as fallback
      res.json(session);
    }
  } catch (err) {
    console.error('Join session error (outer catch):', err);
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    res.status(500).json({ error: 'Failed to join session', details: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// POST /sessions/:id/leave - leave a session
router.post('/:id/leave', requireAuth, async (req: Request & { userId?: string }, res: Response) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const userIdStr = req.userId?.toString();
    if (!session.participants || !session.participants.map((id: any) => id.toString()).includes(userIdStr)) {
      return res.status(400).json({ error: 'Not a participant' });
    }
    session.participants = session.participants.filter((id: any) => id.toString() !== userIdStr);
    await session.save();
    const populatedSession = await Session.findById(session._id)
      .populate({ path: 'participants', select: 'name avatar email' })
      .populate({ path: 'hostId', select: 'name avatar email' });
    res.json(populatedSession);
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave session' });
  }
});

export default router; 