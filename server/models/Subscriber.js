import mongoose from 'mongoose';

// Newsletter subscribers ("Join the ORiXA community").
const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    source: { type: String, default: 'website', maxlength: 40 },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

export const Subscriber = mongoose.model('Subscriber', subscriberSchema);
