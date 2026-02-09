import mongoose from 'mongoose';

const beltHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userSkillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSkill',
    required: true,
  },
  skillCatalogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillCatalog',
    required: true,
  },
  fromBelt: {
    type: String,
    default: null,
  },
  toBelt: {
    type: String,
    required: true,
    enum: ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'],
  },
  achievedAt: {
    type: Date,
    default: Date.now,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null,
  },
});

beltHistorySchema.index({ userId: 1, userSkillId: 1, achievedAt: 1 });
beltHistorySchema.index({ skillCatalogId: 1, toBelt: 1 });

export default mongoose.model('BeltHistory', beltHistorySchema);
