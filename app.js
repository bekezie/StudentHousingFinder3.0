let createError = require("http-errors");
//const MongoStore = require("connect-mongo");
let express = require("express");
let path = require("path");
let cookieParser = require("cookie-parser");
let logger = require("morgan");
let sessions = require("express-session");
let flash = require("connect-flash");

//let bodyParser = require("body-parser");
//let {check, validationResult} = require("express-validator");

let indexRouter = require("./routes/index");
let authRouter = require("./routes/auth");

let app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(flash());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
//const DB_NAME = "project2";
app.use(
  sessions({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored

    secret: "564653456fsd3fd76f3",
    cookie: {
      expires: 10000000,
    },
  })
);

app.use(flash());

app.use("/auth", authRouter);
app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
