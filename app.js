require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const { BlobServiceClient } = require("@azure/storage-blob");
const session = require("express-session");
const msal = require("@azure/msal-node");

const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");

const app = express();

// Use Azure for prod or Azurite for local
const connectionString =
  process.env.NODE_ENV === "production"
    ? process.env.AZURE_STORAGE_CONNECTION_STRING
    : "UseDevelopmentStorage=true";

// Azure Blob Storage setup
const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);

// MSAL config
const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_ENTRA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_ENTRA_TENANT_ID}`,
    clientSecret: process.env.MICROSOFT_ENTRA_CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: "Info",
    },
  },
};

const msalClient = new msal.ConfidentialClientApplication(msalConfig);

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Make Azure services available to routes
app.use((req, res, next) => {
  req.blobServiceClient = blobServiceClient;
  req.msalClient = msalClient;
  next();
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/auth", authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
