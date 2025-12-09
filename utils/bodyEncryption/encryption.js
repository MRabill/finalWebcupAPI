const Crypto = require("crypto-js");

const secretKey = process.env.BODY_ENCRYPTION_SECRET_KEY;

const encrypt = (text) => {
  var encryptedAES = Crypto.AES.encrypt(text, secretKey);
  return encryptedAES.toString();
};

const decrypt = (text) => {
  var decryptedBytes = Crypto.AES.decrypt(text, secretKey);
  return decryptedBytes.toString(Crypto.enc.Utf8);
};

module.exports = {
  encrypt,
  decrypt,
};
