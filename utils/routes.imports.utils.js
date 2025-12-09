const express = require("express");
const router = express();
const { default: axios } = require("axios");

const dayjs = require("dayjs");
const localeData = require("dayjs/plugin/localeData");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
dayjs.extend(localeData);

const dbConfig = require("../configs/db");
const knex = require("knex");
const knexDb = knex(dbConfig);

const fs = require("fs");

const path = require("path");
const mime = require("mime");

const multer = require("multer");

const readRecursively = require("./readRecursively");

const uuid = require("uuid");

const bcrypt = require("bcrypt");
const bodyEncryption = require("./bodyEncryption/encryption");
const decrypt = require("./bodyEncryption/encryption").decrypt;
const encrypt = require("./bodyEncryption/encryption").encrypt;

module.exports = {
  express,
  router,
  axios,
  dayjs,
  knexDb,
  fs,
  path,
  mime,
  multer,
  readRecursively,
  uuid,
  bcrypt,
  bodyEncryption,
  decrypt,
  encrypt,
};
