import mongoose from 'mongoose';

const BlockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // nanoid
    type: { type: String, enum: ['heading', 'paragraph', 'list'], required: true },
    title: { type: String },
    content: { type: mongoose.Schema.Types.Mixed, required: true }, // string or string[]
    order: { type: Number, required: true }
  },
  { _id: false }
);

const PolicySchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    blocks: { type: [BlockSchema], default: [] },
    meta: {
      generatedBy: { type: String, default: 'gemini' },
      createdAt: { type: Date, default: Date.now },
      modifiedAt: { type: Date, default: Date.now }
    }
  },
  { collection: 'policies' }
);

PolicySchema.pre('save', function (next) {
  this.meta.modifiedAt = new Date();
  next();
});

export const Policy = mongoose.model('Policy', PolicySchema);
