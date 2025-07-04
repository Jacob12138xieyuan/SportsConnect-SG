import { Router, Request, Response } from 'express';
import Venue from './models/Venue';

const router = Router();

// GET /venues?sport=Badminton
router.get('/', async (req: Request, res: Response) => {
  const { sport } = req.query;
  if (!sport) return res.status(400).json({ error: 'Missing sport parameter' });
  try {
    const venues = await Venue.find({ sport }).sort({ name: 1 });
    res.json(venues);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// POST /venues { name, sport }
router.post('/', async (req: Request, res: Response) => {
  const { name, sport } = req.body;
  if (!name || !sport) return res.status(400).json({ error: 'Missing name or sport' });
  try {
    const venue = await Venue.findOneAndUpdate(
      { name, sport },
      { name, sport },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(venue);
  } catch (err) {
    res.status(400).json({ error: 'Failed to add venue', details: err });
  }
});

export default router; 