// middleware/authenticate.js
const basicAuth = require("basic-auth");

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const authenticate = (req, res, next) => {
  const user = basicAuth(req);

  if (!user || user.name !== ADMIN_USER || user.pass !== ADMIN_PASSWORD) {
    res.set("WWW-Authenticate", 'Basic realm="401"');
    res.status(401).send("Authentication required."); // custom message
    return;
  }

  next();
};

module.exports = authenticate;
