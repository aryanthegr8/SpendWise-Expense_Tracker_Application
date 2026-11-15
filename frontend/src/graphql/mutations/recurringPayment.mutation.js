import { gql } from "@apollo/client";
const fields = `_id name amount category frequency nextDueDate active history { _id scheduledDate paidOn amount }`;
export const CREATE_RECURRING_PAYMENT = gql`mutation CreateRecurringPayment($input: CreateRecurringPaymentInput!) { createRecurringPayment(input: $input) { ${fields} } }`;
export const UPDATE_RECURRING_PAYMENT = gql`mutation UpdateRecurringPayment($id: ID!, $input: UpdateRecurringPaymentInput!) { updateRecurringPayment(id: $id, input: $input) { ${fields} } }`;
export const SET_RECURRING_PAYMENT_ACTIVE = gql`mutation SetRecurringPaymentActive($id: ID!, $active: Boolean!) { setRecurringPaymentActive(id: $id, active: $active) { ${fields} } }`;
export const MARK_RECURRING_PAYMENT_PAID = gql`mutation MarkRecurringPaymentPaid($id: ID!) { markRecurringPaymentPaid(id: $id) { ${fields} } }`;
export const DELETE_RECURRING_PAYMENT = gql`mutation DeleteRecurringPayment($id: ID!) { deleteRecurringPayment(id: $id) }`;
