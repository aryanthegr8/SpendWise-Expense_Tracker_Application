import { gql } from "@apollo/client";
export const SAVE_BUDGET = gql`
  mutation SaveBudget($month: String!, $amount: Float!) {
    saveBudget(month: $month, amount: $amount) { _id month amount }
  }
`;
