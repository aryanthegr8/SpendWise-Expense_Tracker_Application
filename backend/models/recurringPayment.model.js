import mongoose from "mongoose";

const paymentHistorySchema = new mongoose.Schema({
  scheduledDate: { type: String, required: true },
  paidOn: { type: Date, default: Date.now },
  amount: { type: Number, required: true, min: 0.01 },
}, { _id: true });

const recurringPaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0.01 },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  frequency: { type: String, enum: ["weekly", "monthly", "yearly"], required: true },
  nextDueDate: { type: String, required: true }, // YYYY-MM-DD, calendar date (UTC arithmetic)
  active: { type: Boolean, default: true },
  history: { type: [paymentHistorySchema], default: [] },
}, { timestamps: true });

// Matches user-scoped upcoming-payment ordering.
recurringPaymentSchema.index({ userId: 1, nextDueDate: 1, name: 1 });

export default mongoose.model("RecurringPayment", recurringPaymentSchema);
