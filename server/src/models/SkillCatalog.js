import mongoose from 'mongoose';

const skillCatalogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: null,
  },
  trainingContext: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  usedByCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

skillCatalogSchema.index({ name: 'text' });

export default mongoose.model('SkillCatalog', skillCatalogSchema);
