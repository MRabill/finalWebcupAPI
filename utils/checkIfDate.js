const checkIfDate = (date) => {
  return (
    date &&
    typeof date !== "number" &&
    typeof date !== "boolean" &&
    typeof date !== "string" &&
    !Array.isArray(date) &&
    // /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/.test(element) &&
    Object.prototype.toString.call(new Date(date)) === "[object Date]" &&
    !isNaN(date)
  );
};

module.exports = checkIfDate;
