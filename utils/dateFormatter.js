const dayjs = require("dayjs");
const localeData = require("dayjs/plugin/localeData");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
dayjs.extend(localeData);

const dateFormatter = (date, type = "small", nullValue = "-") => {
  return date
    ? type === "small"
      ? dayjs(date).format("DD MMM YYYY")
      : dayjs(date).format("DD MMM YYYY HH:mm:ss")
    : nullValue;
};

module.exports = dateFormatter;
