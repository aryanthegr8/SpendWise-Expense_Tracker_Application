
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (amount) => {
  const value = Number(amount);

  return currencyFormatter.format(
    Number.isFinite(value) ? value : 0
  );
};
