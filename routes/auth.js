const express = require("express");
const router = express.Router();
const msal = require("@azure/msal-node");

// Define a function to get the correct redirect URI
function getRedirectUri(req) {
  if (process.env.NODE_ENV === "production") {
    return `https://${req.get("host")}/auth/redirect`;
  } else {
    // For local development, use the HTTPS URL
    return (
      process.env.LOCAL_REDIRECT_URI || "http://localhost:3000/auth/redirect"
    );
  }
}

// Define a function to get the post-logout redirect URI
function getPostLogoutRedirectUri(req) {
  if (process.env.NODE_ENV === "production") {
    return `https://${req.get("host")}/`;
  } else {
    // For local development, use the HTTPS URL
    return process.env.LOCAL_URI || "http://localhost:3000/";
  }
}

router.get("/login", (req, res) => {
  const redirectUri = getRedirectUri(req);
  const authCodeUrlParameters = {
    scopes: ["user.read"],
    redirectUri: redirectUri,
    // prompt: "select_account",
  };

  req.msalClient
    .getAuthCodeUrl(authCodeUrlParameters)
    .then((response) => {
      res.redirect(response);
    })
    .catch((error) => console.log(JSON.stringify(error)));
});

router.get("/redirect", async (req, res) => {
  if (req.query.error) {
    return res
      .status(500)
      .send(`Authentication error: ${req.query.error_description}`);
  }

  if (!req.query.code) {
    return res.status(400).send("Authorization code not found in the request");
  }

  const redirectUri = getRedirectUri(req);
  const tokenRequest = {
    code: req.query.code,
    scopes: ["user.read"],
    redirectUri: getRedirectUri(req),
  };

  try {
    const response = await req.msalClient.acquireTokenByCode(tokenRequest);

    req.session.isAuthenticated = true;
    req.session.user = response.account;
    req.session.accessToken = response.accessToken;

    // Here you would typically fetch the user's role from your database
    req.session.userRole = "Customer";

    return res.redirect("/documents");
  } catch (error) {
    console.error("Error acquiring token:", error);
    return res.status(500).send(`Authentication error: ${error.message}`);
  }
});

router.get("/logout", (req, res) => {
  const logoutUri = `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(
    getPostLogoutRedirectUri(req)
  )}`;

  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.clearCookie("connect.sid", { path: "/" }).redirect(logoutUri);
  });
});

module.exports = router;
