import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";

const transactionResolver = {
  Query: {
    transactions: async (_, __, context) => {
      try {
        if (!context.getUser()) throw new Error("Unauthorized");
        const userId = await context.getUser()._id;

        const transactions = await Transaction.find({ userId });
        return transactions;
      } catch (err) {
        console.log("Error getting transactions: ", err);
        throw new Error("Error getting transactions");
      }
    },
    transaction: async (_, { transactionId }, context) => {
      const user = context.getUser();
      if (!user) throw new Error("Unauthorized");
      return Transaction.findOne({ _id: transactionId, userId: user._id });
    },
    categoryStatistics: async (_, __, context) => {
      const user = context.getUser();
      if (!user?._id) throw new Error("Unauthorized");

      // Aggregate on the database instead of loading all transactions into Node.js.
      // Preserve the existing GraphQL response shape and per-user isolation.
      return Transaction.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: "$category", totalAmount: { $sum: "$amount" } } },
        { $project: { _id: 0, category: "$_id", totalAmount: 1 } },
      ]);
    },
  },
  Mutation: {
    createTransaction: async (_, { input }, context) => {
      const user = context.getUser();
      if (!user) throw new Error("Unauthorized");
      const newTransaction = new Transaction({ ...input, userId: user._id });
      await newTransaction.save();
      return newTransaction;
    },
    updateTransaction: async (_, { input }, context) => {
      const user = context.getUser();
      if (!user) throw new Error("Unauthorized");
      const { transactionId, ...changes } = input;
      const updated = await Transaction.findOneAndUpdate(
        { _id: transactionId, userId: user._id },
        { $set: changes },
        { new: true, runValidators: true }
      );
      if (!updated) throw new Error("Transaction not found");
      return updated;
    },
    deleteTransaction: async (_, { transactionId }, context) => {
      const user = context.getUser();
      if (!user) throw new Error("Unauthorized");
      const deleted = await Transaction.findOneAndDelete({ _id: transactionId, userId: user._id });
      if (!deleted) throw new Error("Transaction not found");
      return deleted;
    },
  },
  Transaction: {
    user: async (parent) => {
      const userId = parent.userId;
      try {
        const user = await User.findById(userId);
        return user;
      } catch (err) {
        console.error("Error getting user:", err);
        throw new Error("Error gettig user");
      }
    },
  },
};

export default transactionResolver;
