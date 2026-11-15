import mongoose from "mongoose";
import RecurringPayment from "../models/recurringPayment.model.js";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
function validDate(value) {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
function nextDate(date, frequency) {
  const d = new Date(`${date}T00:00:00.000Z`);
  if (frequency === "weekly") d.setUTCDate(d.getUTCDate() + 7);
  else {
    const day = d.getUTCDate();
    d.setUTCDate(1);
    if (frequency === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
    else d.setUTCFullYear(d.getUTCFullYear() + 1);
    const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, lastDay));
  }
  return d.toISOString().slice(0, 10);
}
function userId(context) {
  const id = context.getUser?.()?._id;
  if (!id) throw new Error("Unauthorized");
  return id;
}
function validate(input) {
  if (input.name !== undefined && (typeof input.name !== "string" || !input.name.trim() || input.name.length > 100)) throw new Error("Enter a valid name (1–100 characters)");
  if (input.category !== undefined && (typeof input.category !== "string" || !input.category.trim() || input.category.length > 60)) throw new Error("Enter a valid category");
  if (input.amount !== undefined && (!Number.isFinite(input.amount) || input.amount <= 0)) throw new Error("Amount must be greater than zero");
  if (input.frequency !== undefined && !["weekly", "monthly", "yearly"].includes(input.frequency)) throw new Error("Invalid frequency");
  if (input.nextDueDate !== undefined && !validDate(input.nextDueDate)) throw new Error("Date must be YYYY-MM-DD");
}
async function owned(id, context) {
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid recurring payment ID");
  const doc = await RecurringPayment.findOne({ _id: id, userId: userId(context) });
  if (!doc) throw new Error("Recurring payment not found");
  return doc;
}
const recurringPaymentResolver = {
  Query: {
    recurringPayments: async (_, __, context) => RecurringPayment.find({ userId: userId(context) }).sort({ nextDueDate: 1, name: 1 }).lean(),
  },
  Mutation: {
    createRecurringPayment: async (_, { input }, context) => {
      const id = userId(context);
      validate(input);
      return RecurringPayment.create({ ...input, name: input.name.trim(), category: input.category.trim(), userId: id });
    },
    updateRecurringPayment: async (_, { id, input }, context) => {
      const doc = await owned(id, context);
      validate(input);
      for (const key of ["name", "amount", "category", "frequency", "nextDueDate"]) {
        if (input[key] !== undefined && input[key] !== null) doc[key] = typeof input[key] === "string" && ["name", "category"].includes(key) ? input[key].trim() : input[key];
      }
      await doc.save();
      return doc;
    },
    setRecurringPaymentActive: async (_, { id, active }, context) => {
      const doc = await owned(id, context);
      doc.active = active;
      await doc.save();
      return doc;
    },
    markRecurringPaymentPaid: async (_, { id }, context) => {
      const doc = await owned(id, context);
      if (!doc.active) throw new Error("Resume this payment before marking it paid");
      // Allow confirming an upcoming scheduled payment early.
      // paidOn records the actual confirmation time; scheduledDate remains the original due date.
      // Atomic compare-and-swap prevents duplicate history entries from double clicks.
      const scheduledDate = doc.nextDueDate;
      const nextDueDate = nextDate(scheduledDate, doc.frequency);
      const result = await RecurringPayment.findOneAndUpdate(
        { _id: doc._id, userId: userId(context), active: true, nextDueDate: scheduledDate },
        { $push: { history: { scheduledDate, amount: doc.amount, paidOn: new Date() } }, $set: { nextDueDate } },
        { new: true, runValidators: true }
      );
      if (!result) throw new Error("Payment changed; refresh and try again");
      return result;
    },
    deleteRecurringPayment: async (_, { id }, context) => {
      if (!mongoose.isValidObjectId(id)) throw new Error("Invalid recurring payment ID");
      const result = await RecurringPayment.deleteOne({ _id: id, userId: userId(context) });
      return result.deletedCount === 1;
    },
  },
};
export default recurringPaymentResolver;
