import Budget from "../models/budget.model.js";
const validMonth = (month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
const budgetResolver = {
  Query: {
    budgets: async (_, __, context) => {
      const user = context.getUser();
      if (!user) throw new Error("Unauthorized");
      return Budget.find({ userId: user._id }).sort({ month: -1 }).lean();
    },
  },
  Mutation: {
    saveBudget: async (_, { month, amount }, context) => {
      const user = context.getUser();
      if (!user) throw new Error("Unauthorized");
      if (!validMonth(month)) throw new Error("Invalid month. Use YYYY-MM.");
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Budget must be greater than zero.");
      return Budget.findOneAndUpdate(
        { userId: user._id, month },
        { $set: { amount } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    },
  },
};
export default budgetResolver;
