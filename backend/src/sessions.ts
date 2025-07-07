import { Router, Request, Response } from 'express';
import Session from './models/Session';
import { requireAuth } from './auth';
import mongoose from 'mongoose';

const router = Router();

// GET /sessions/hosted - get user's hosted sessions (must be before /:id route)
router.get('/hosted', requireAuth, async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000)); // 2 hours ago

    // Create a cutoff datetime string for comparison
    const cutoffDate = twoHoursAgo.toISOString().split('T')[0]; // YYYY-MM-DD
    const cutoffTime = twoHoursAgo.toTimeString().slice(0, 5); // HH:MM

    // Query to fetch only user's hosted sessions (not expired more than 2 hours)
    const hostedSessions = await Session.find({
      hostId: userId,
      $or: [
        // Future sessions (date is after today)
        { startDate: { $gt: now.toISOString().split('T')[0] } },

        // Sessions today that haven't started yet
        {
          startDate: now.toISOString().split('T')[0],
          startTime: { $gt: now.toTimeString().slice(0, 5) }
        },

        // Sessions that started within the last 2 hours (recently expired)
        {
          $or: [
            {
              startDate: cutoffDate,
              startTime: { $gte: cutoffTime }
            },
            {
              startDate: { $gt: cutoffDate }
            }
          ]
        },

        // Include sessions without proper date/time (safety fallback)
        { startDate: { $exists: false } },
        { startTime: { $exists: false } }
      ]
    })
    .populate({ path: 'participants', select: 'name avatar email' })
    .sort({
      startDate: -1,  // Descending order (newest first)
      startTime: -1   // Descending order (latest time first)
    });

    res.json(hostedSessions);
  } catch (err) {
    console.error('Error fetching hosted sessions:', err);
    res.status(500).json({ error: 'Failed to fetch hosted sessions' });
  }
});

// GET /sessions - list sessions (only fetch sessions not expired more than 2 hours)
router.get('/', async (_req, res) => {
  try {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000)); // 2 hours ago

    // Create a cutoff datetime string for comparison
    const cutoffDate = twoHoursAgo.toISOString().split('T')[0]; // YYYY-MM-DD
    const cutoffTime = twoHoursAgo.toTimeString().slice(0, 5); // HH:MM

    // Query to fetch only relevant sessions:
    // 1. Sessions in the future (startDate > today OR (startDate = today AND startTime > now))
    // 2. Sessions that started within the last 2 hours
    const sessions = await Session.find({
      $or: [
        // Future sessions (date is after today)
        { startDate: { $gt: now.toISOString().split('T')[0] } },

        // Sessions today that haven't started yet
        {
          startDate: now.toISOString().split('T')[0],
          startTime: { $gt: now.toTimeString().slice(0, 5) }
        },

        // Sessions that started within the last 2 hours
        {
          $or: [
            // Sessions on the cutoff date that started after the cutoff time
            {
              startDate: cutoffDate,
              startTime: { $gte: cutoffTime }
            },
            // Sessions on dates after the cutoff date
            {
              startDate: { $gt: cutoffDate }
            }
          ]
        },

        // Include sessions without proper date/time (safety fallback)
        { startDate: { $exists: false } },
        { startTime: { $exists: false } }
      ]
    }).sort({
      startDate: 1,
      startTime: 1
    });

    res.json(sessions);
  } catch (err) {
    console.error('Error fetching sessions:', err);
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
    startDate: req.body.startDate,
    hostId: req.userId
  });
  
  try {
    const { countHostIn, ...sessionFields } = req.body;
    const sessionData = {
      ...sessionFields,
      hostId: req.userId,
      participants: [], // Initialize empty participants array
    };

    const session = new Session(sessionData);

    // If host should be counted, add them to participants
    if (countHostIn) {
      session.participants.push(new mongoose.Types.ObjectId(req.userId));
    }

    await session.save();
    console.log('Session created successfully:', session._id, 'Host included in participants:', countHostIn);
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
    // Calculate current players using only participants count
    const currentPlayers = session.participants?.length || 0;

    console.log('Session found:', {
      sessionId: session._id,
      currentParticipants: session.participants,
      participantCount: session.participants?.length || 0,
      currentPlayers: currentPlayers,
      maxPlayers: session.maxPlayers,
      userTryingToJoin: userIdStr
    });

    // Check if user is the host
    if (session.hostId.toString() === userIdStr) {
      console.log('Host cannot join their own session');
      return res.status(400).json({ error: 'Host cannot join their own session' });
    }

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
      newCurrentPlayers: session.participants?.length || 0
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
        currentPlayers: populatedSession?.participants?.length || 0
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

    // Check if user is the host and if they're the only participant
    const isHost = session.hostId.toString() === userIdStr;
    if (isHost && session.participants.length === 1) {
      return res.status(400).json({ error: 'Host cannot leave as the only participant. Please cancel the session instead.' });
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

// DELETE /sessions/:id - delete a session (host only)
router.delete('/:id', requireAuth, async (req: Request & { userId?: string }, res: Response) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const userIdStr = req.userId?.toString();

    // Check if user is the host
    if (session.hostId.toString() !== userIdStr) {
      return res.status(403).json({ error: 'Only the host can cancel this session' });
    }

    // Delete the session
    await Session.findByIdAndDelete(req.params.id);
    console.log('Session deleted successfully:', req.params.id, 'by host:', userIdStr);

    res.json({ message: 'Session cancelled successfully' });
  } catch (err) {
    console.error('Delete session error:', err);
    res.status(500).json({ error: 'Failed to cancel session' });
  }
});

export default router;