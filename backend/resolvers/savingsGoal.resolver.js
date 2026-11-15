import mongoose from "mongoose";
import SavingsGoal from "../models/savingsGoal.model.js";

const userIdFrom = (context) => {
  const user = context.getUser();
  if (!user?._id) throw new Error("Unauthorized");
  return user._id;
};
const validId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid goal ID");
};
const validAmount = (amount) => {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than zero");
};
const validName = (name) => {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) throw new Error("Goal name must be 1–80 characters");
  return name.trim();
};
const parseDeadline = (deadline) => {
  if (deadline == null || deadline === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) throw new Error("Deadline must be YYYY-MM-DD");
  const date = new Date(`${deadline}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== deadline) throw new Error("Invalid deadline");
  return date;
};
const ownedGoal = async (goalId, userId) => {
  validId(goalId);
  const goal = await SavingsGoal.findOne({ _id: goalId, userId });
  if (!goal) throw new Error("Savings goal not found");
  return goal;
};
const iso = (value) => value ? new Date(value).toISOString() : null;

const savingsGoalResolver = {
  Query: {
    savingsGoals: async (_, __, context) => SavingsGoal.find({ userId: userIdFrom(context) }).sort({ createdAt: -1 }).lean(),
  },
  Mutation: {
    createSavingsGoal: async (_, { name, targetAmount, deadline }, context) => {
      const userId = userIdFrom(context);
      validAmount(targetAmount);
      return SavingsGoal.create({ userId, name: validName(name), targetAmount, deadline: parseDeadline(deadline) });
    },
    updateSavingsGoal: async (_, { goalId, name, targetAmount, deadline }, context) => {
      const goal = await ownedGoal(goalId, userIdFrom(context));
      validAmount(targetAmount);
      goal.name = validName(name);
      goal.targetAmount = targetAmount;
      goal.deadline = parseDeadline(deadline);
      await goal.save();
      return goal;
    },
    deleteSavingsGoal: async (_, { goalId }, context) => {
      const goal = await ownedGoal(goalId, userIdFrom(context));
      await goal.deleteOne();
      return true;
    },
    addSavingsContribution: async (_, { goalId, amount, note }, context) => {
      const goal = await ownedGoal(goalId, userIdFrom(context));
      validAmount(amount);
      if (note && note.length > 200) throw new Error("Note must be 200 characters or less");
      goal.contributions.push({ amount, note: (note || "").trim() });
      await goal.save();
      return goal;
    },
    removeSavingsContribution: async (_, { goalId, contributionId }, context) => {
      const goal = await ownedGoal(goalId, userIdFrom(context));
      validId(contributionId);
      const contribution = goal.contributions.id(contributionId);
      if (!contribution) throw new Error("Contribution not found");
      contribution.deleteOne();
      await goal.save();
      return goal;
    },
  },
  SavingsGoal: {
    savedAmount: (goal) => goal.contributions.reduce((sum, contribution) => sum + contribution.amount, 0),
    deadline: (goal) => goal.deadline ? iso(goal.deadline).slice(0, 10) : null,
    createdAt: (goal) => iso(goal.createdAt),
  },
  SavingsContribution: { date: (contribution) => iso(contribution.date) },
};
export default savingsGoalResolver;
