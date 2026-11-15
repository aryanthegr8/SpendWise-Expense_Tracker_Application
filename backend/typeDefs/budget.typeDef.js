const budgetTypeDef = `#graphql
  type Budget { _id: ID! month: String! amount: Float! }
  extend type Query { budgets: [Budget!]! }
  extend type Mutation { saveBudget(month: String!, amount: Float!): Budget! }
`;
export default budgetTypeDef;
