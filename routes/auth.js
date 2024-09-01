const express = require("express");
const router = express.Router();
const msal = require("@azure/msal-node");

// Define a function to get the correct redirect URI
function getRedirectUri(req) {
  if (process.env.NODE_ENV === "production") {
    return `https://${req.get("host")}/auth/redirect`;
  }
  return "http://localhost:3000/auth/redirect";
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
    .catch((error) => console.log(JSON.stringify(error)));
});

router.get("/redirect", (req, res) => {
  const redirectUri = getRedirectUri(req);
  const tokenRequest = {
    code: req.query.code,
    scopes: ["user.read"],
    redirectUri: redirectUri,
  };

  req.msalClient
    .acquireTokenByCode(tokenRequest)
    .then((response) => {
      req.session.isAuthenticated = true;
      req.session.user = response.account;

      // Here you would typically fetch the user's role from your database
      // For this example, we'll just set a default role
      req.session.userRole = "Admin";

      res.redirect("/documents");
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
