import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // Not required for Google users
  name: { type: String, required: true },
  googleId: { type: String },
}, { timestamps: true });

export default mongoose.model('User', userSchema); 