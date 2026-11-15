import { gql } from "@apollo/client";
export const GET_BUDGETS = gql`
  query GetBudgets { budgets { _id month amount } }
`;
