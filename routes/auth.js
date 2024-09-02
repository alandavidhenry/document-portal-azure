const express = require("express");
const router = express.Router();
const msal = require("@azure/msal-node");
const winston = require("winston");

// Setup Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "auth-service" },
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

function getRedirectUri(req) {
  if (process.env.NODE_ENV === "production") {
    return `https://${req.get("host")}/auth/redirect`;
  } else {
    return (
      process.env.LOCAL_REDIRECT_URI || "http://localhost:3000/auth/redirect"
    );
  }
}

function getPostLogoutRedirectUri(req) {
  if (process.env.NODE_ENV === "production") {
    return `https://${req.get("host")}/`;
  } else {
    return process.env.LOCAL_URI || "http://localhost:3000/";
  }
}

router.get("/login", (req, res) => {
  const redirectUri = getRedirectUri(req);
  const authCodeUrlParameters = {
    scopes: ["user.read"],
    redirectUri: redirectUri,
  };

  req.msalClient
    .getAuthCodeUrl(authCodeUrlParameters)
    .then((response) => {
      res.redirect(response);
    })
    .catch((error) => {
      logger.error("Error getting auth code URL:", error);
      res.status(500).send("Error initiating login process");
    });
});

router.get("/redirect", async (req, res) => {
  if (req.query.error) {
    logger.error(`Authentication error: ${req.query.error_description}`);
    return res
      .status(500)
      .send(`Authentication error: ${req.query.error_description}`);
  }

  if (!req.query.code) {
    logger.error("Authorization code not found in the request");
    return res.status(400).send("Authorization code not found in the request");
  }

  const redirectUri = getRedirectUri(req);
  const tokenRequest = {
    code: req.query.code,
    scopes: ["user.read"],
    redirectUri: redirectUri,
  };

  try {
    const response = await req.msalClient.acquireTokenByCode(tokenRequest);

    req.session.isAuthenticated = true;
    req.session.user = response.account;
    req.session.accessToken = response.accessToken;

    // Here you would typically fetch the user's role from your database
    req.session.userRole = "Customer";

    // Save the session before redirecting
    req.session.save((err) => {
      if (err) {
        logger.error("Error saving session:", err);
        return res.status(500).send("Error completing authentication");
      }
      return res.redirect("/documents");
    });
  } catch (error) {
    logger.error("Error acquiring token:", error);
    return res.status(500).send(`Authentication error: ${error.message}`);
  }
});

router.get("/logout", (req, res) => {
  const logoutUri = `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(
    getPostLogoutRedirectUri(req)
  )}`;

  req.session.destroy((err) => {
    if (err) {
      logger.error("Error destroying session:", err);
    }
    res.clearCookie("connect.sid", { path: "/" }).redirect(logoutUri);
  });
});

module.exports = router;
