import mongoose from "mongoose";

const contributionSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0.01 },
  note: { type: String, trim: true, maxlength: 200, default: "" },
  date: { type: Date, default: Date.now },
});

const savingsGoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  targetAmount: { type: Number, required: true, min: 0.01 },
  deadline: { type: Date, default: null },
  contributions: { type: [contributionSchema], default: [] },
}, { timestamps: true });

// Matches user-scoped newest-goal ordering.
savingsGoalSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.SavingsGoal || mongoose.model("SavingsGoal", savingsGoalSchema);
