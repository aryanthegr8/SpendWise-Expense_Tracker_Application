import { mergeTypeDefs } from "@graphql-tools/merge";
import userTypeDef from "./user.typeDef.js";
import transactionTypeDef from "./transaction.typeDef.js";
import budgetTypeDef from "./budget.typeDef.js";
import savingsGoalTypeDef from "./savingsGoal.typeDef.js";
import recurringPaymentTypeDef from "./recurringPayment.typeDef.js";
const mergedTypeDefs = mergeTypeDefs([userTypeDef, transactionTypeDef, budgetTypeDef, savingsGoalTypeDef, recurringPaymentTypeDef]);
export default mergedTypeDefs;
