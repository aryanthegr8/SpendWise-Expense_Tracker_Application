const savingsGoalTypeDef = `#graphql
  type SavingsContribution {
    _id: ID!
    amount: Float!
    note: String!
    date: String!
  }

  type SavingsGoal {
    _id: ID!
    name: String!
    targetAmount: Float!
    deadline: String
    savedAmount: Float!
    contributions: [SavingsContribution!]!
    createdAt: String!
  }

  extend type Query {
    savingsGoals: [SavingsGoal!]!
  }

  extend type Mutation {
    createSavingsGoal(name: String!, targetAmount: Float!, deadline: String): SavingsGoal!
    updateSavingsGoal(goalId: ID!, name: String!, targetAmount: Float!, deadline: String): SavingsGoal!
    deleteSavingsGoal(goalId: ID!): Boolean!
    addSavingsContribution(goalId: ID!, amount: Float!, note: String): SavingsGoal!
    removeSavingsContribution(goalId: ID!, contributionId: ID!): SavingsGoal!
  }
`;
export default savingsGoalTypeDef;
