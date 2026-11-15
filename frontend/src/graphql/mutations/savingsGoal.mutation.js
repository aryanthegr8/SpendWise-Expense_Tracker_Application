import { gql } from "@apollo/client";
export const CREATE_SAVINGS_GOAL = gql`
  mutation CreateSavingsGoal($name: String!, $targetAmount: Float!, $deadline: String) {
    createSavingsGoal(name: $name, targetAmount: $targetAmount, deadline: $deadline) { _id }
  }
`;
export const UPDATE_SAVINGS_GOAL = gql`
  mutation UpdateSavingsGoal($goalId: ID!, $name: String!, $targetAmount: Float!, $deadline: String) {
    updateSavingsGoal(goalId: $goalId, name: $name, targetAmount: $targetAmount, deadline: $deadline) { _id }
  }
`;
export const DELETE_SAVINGS_GOAL = gql`
  mutation DeleteSavingsGoal($goalId: ID!) { deleteSavingsGoal(goalId: $goalId) }
`;
export const ADD_SAVINGS_CONTRIBUTION = gql`
  mutation AddSavingsContribution($goalId: ID!, $amount: Float!, $note: String) {
    addSavingsContribution(goalId: $goalId, amount: $amount, note: $note) { _id }
  }
`;
export const REMOVE_SAVINGS_CONTRIBUTION = gql`
  mutation RemoveSavingsContribution($goalId: ID!, $contributionId: ID!) {
    removeSavingsContribution(goalId: $goalId, contributionId: $contributionId) { _id }
  }
`;
