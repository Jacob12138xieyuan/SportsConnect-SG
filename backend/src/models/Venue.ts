import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sport: { type: String, required: true },
}, { timestamps: true });

venueSchema.index({ name: 1, sport: 1 }, { unique: true });

export default mongoose.model('Venue', venueSchema); 