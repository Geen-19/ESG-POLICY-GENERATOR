import mongoose from "mongoose";

const BlockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["heading", "paragraph", "list"], required: true },
    title: { type: String },
    content: { type: mongoose.Schema.Types.Mixed, required: true },
    order: { type: Number, required: true }
  },
  { _id: false }
);

const PolicySchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    blocks: { type: [BlockSchema], required: true },
    meta: {
      generatedBy: { type: String, default: "gemini" },
      createdAt: { type: Date, default: Date.now },
      modifiedAt: { type: Date, default: Date.now }
    }
  },
  { timestamps: false }
);

// 💡 Always assign order if missing
PolicySchema.pre("validate", function (next) {
  if (Array.isArray(this.blocks)) {
    this.blocks = this.blocks.map((b, i) => ({
      ...b,
      order: typeof b.order === "number" ? b.order : i + 1
    }));
  }
  next();
});

export const Policy = mongoose.model("Policy", PolicySchema);
