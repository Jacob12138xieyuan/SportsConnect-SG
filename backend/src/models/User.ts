import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // Not required for Google users
  name: { type: String, required: true },
  googleId: { type: String },
  avatar: { type: String }, // Optional avatar URL
  profilePicture: { type: String }, // Optional profile picture URL
}, { timestamps: true });

export default mongoose.model('User', userSchema); 