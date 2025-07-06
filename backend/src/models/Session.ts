import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sport: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  venue: { type: String, required: true },
  skillLevel: { type: String, required: true },
  hostName: { type: String, required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  maxPlayers: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  notes: { type: String },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  countHostIn: { type: Boolean, default: true },
}, { timestamps: true });

// Virtual field to calculate current players dynamically
sessionSchema.virtual('currentPlayers').get(function() {
  // Count participants + host (if countHostIn is true)
  const hostCount = this.countHostIn ? 1 : 0;
  return (this.participants?.length || 0) + hostCount;
});

// Ensure virtual fields are serialized
sessionSchema.set('toJSON', { virtuals: true });
sessionSchema.set('toObject', { virtuals: true });

export default mongoose.model('Session', sessionSchema); 