import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['skill_started', 'belt_promotion', 'assessment_passed', 'streak_milestone'],
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ 'data.skillSlug': 1, createdAt: -1 });

export default mongoose.model('Activity', activitySchema);
