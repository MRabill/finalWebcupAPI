const passportJWT = require("passport-jwt");
const JwtStrategy = passportJWT.Strategy;
const {
  mainKnex,
  EMP_DB,
  EMP_TB,
  EMP_TB_EMAIL_FIELD,
} = require("../utils/routes.imports.utils");
const extractJwt = passportJWT.ExtractJwt;

const options = {
  jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

/**
 *  If a user is found, Passport puts the user on the request object and considers the user authenticated
 * @type {JwtStrategy}
 */

const strategy = new JwtStrategy(options, async (payload, next) => {
  try {
    if (!payload) {
      next(false, "NO_JWT_FOUND");
      return;
    }

    const checkUserActive = await mainKnex("user")
      .where({ email: payload.email })
      .then((row) => {
        const userArr = row.pop();
        return userArr;
      });

    if (!checkUserActive) {
      next(false, "USER_INACTIVE");
      return;
    }

    return next(null, payload);
  } catch (e) {
    console.log({ e });
    return next(false, "NO_JWT_FOUND");
  }
});

module.exports = strategy;
