import { gql } from "@apollo/client";
export const GET_RECURRING_PAYMENTS = gql`
  query GetRecurringPayments {
    recurringPayments {
      _id name amount category frequency nextDueDate active
      history { _id scheduledDate paidOn amount }
    }
  }
`;
