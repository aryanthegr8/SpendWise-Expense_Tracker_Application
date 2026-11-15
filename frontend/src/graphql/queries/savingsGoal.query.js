import { gql } from "@apollo/client";
export const GET_SAVINGS_GOALS = gql`
  query GetSavingsGoals {
    savingsGoals {
      _id name targetAmount savedAmount deadline createdAt
      contributions { _id amount note date }
    }
  }
`;
