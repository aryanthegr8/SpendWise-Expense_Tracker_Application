import { mergeResolvers } from "@graphql-tools/merge";
import userResolver from "./user.resolver.js";
import transactionResolver from "./transaction.resolver.js";
import budgetResolver from "./budget.resolver.js";
import savingsGoalResolver from "./savingsGoal.resolver.js";
import recurringPaymentResolver from "./recurringPayment.resolver.js";
const mergedResolvers = mergeResolvers([userResolver, transactionResolver, budgetResolver, savingsGoalResolver, recurringPaymentResolver]);
export default mergedResolvers;
