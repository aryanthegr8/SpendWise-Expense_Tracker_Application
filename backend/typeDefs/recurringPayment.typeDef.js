const recurringPaymentTypeDef = `#graphql
  type RecurringPaymentHistory {
    _id: ID!
    scheduledDate: String!
    paidOn: String!
    amount: Float!
  }
  type RecurringPayment {
    _id: ID!
    name: String!
    amount: Float!
    category: String!
    frequency: String!
    nextDueDate: String!
    active: Boolean!
    history: [RecurringPaymentHistory!]!
  }
  input CreateRecurringPaymentInput {
    name: String!
    amount: Float!
    category: String!
    frequency: String!
    nextDueDate: String!
  }
  input UpdateRecurringPaymentInput {
    name: String
    amount: Float
    category: String
    frequency: String
    nextDueDate: String
  }
  extend type Query {
    recurringPayments: [RecurringPayment!]!
  }
  extend type Mutation {
    createRecurringPayment(input: CreateRecurringPaymentInput!): RecurringPayment!
    updateRecurringPayment(id: ID!, input: UpdateRecurringPaymentInput!): RecurringPayment!
    setRecurringPaymentActive(id: ID!, active: Boolean!): RecurringPayment!
    markRecurringPaymentPaid(id: ID!): RecurringPayment!
    deleteRecurringPayment(id: ID!): Boolean!
  }
`;
export default recurringPaymentTypeDef;
