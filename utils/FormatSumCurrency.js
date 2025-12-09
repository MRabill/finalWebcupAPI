const FormatSumCurrency = (currency, dec = 2) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: dec,
  });

  if (currency || currency === 0) {
    const curr = formatter
      .format(currency)
      .toString()
      .substring(1, formatter.format(currency).toString().length)
      .toString();
    return curr;
  } else {
    return "-";
  }
};

module.exports = FormatSumCurrency;
