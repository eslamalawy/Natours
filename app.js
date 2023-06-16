const express = require("express");
const rateLimit = require("express-rate-limit"); // security
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const AppError = require("./utils/appError");
const golbalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const viewRouter = require("./routes/viewRoutes");
const path = require("path");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const app = express();
app.enable('trust proxy'); //as heroku works as proxy,  to get all req info in auth controller jwt creation step

//views
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// 1) GLOBAL MIDDLEWARES
//serving static files
app.use(express.static(path.join(__dirname, "public")));

// Set Security HTTP headers
app.use(helmet({ contentSecurityPolicy: false })); // for mapbox

//to show the requests in console
// if (process.env.NODE_ENV.trim() === "development") {
//   app.use(morgan("dev"));
// }

//stop DOS ATTACT and Brute force attacs
const limiter = rateLimit({
  // limit requests from same IP
  max: 100, // 100 requests per 1 hour
  windowMs: 60 * 60 * 1000,
  message: "Too many requrests from this IP, please try again in an hour!",
});
app.use("/api", limiter); // just on /api

//body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" })); // middleware that used to get the data from the request as json
app.use(cookieParser()); // to parse cookies
//app.use(express.urlencoded({ extended: true, limit: "10kb" })); // for submit from forms

//Data sanitization against NoSQL query injection against "email": {"$gt": ""}
app.use(mongoSanitize());

//Data sanitization against XSS cross-site scripting attacts like  "name": "<div id='bad-code'>name</div>"
app.use(xss());

//prevent paramter pollution like {{URL}}api/v1/tours?sort=duration&sort=price it make it in single object
app.use(
  hpp({
    whitelist: [
      "duration",
      "price",
      "ratingsAverage",
      "difficulty",
      "maxGroupSize",
      "ratingQuantity",
    ], // to use {{URL}}api/v1/tours?duration=4&duration=2 // to not merge it
  })
);

app.use(compression()); // compression all the text or json sending to the client

// Test middleware
app.use((req, res, next) => {
  //console.log("Request Cookies:", req.cookies);
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  next();
});

//     route   [/api/v1/tours/:id/:y] if you want y to be optional paramter then add ? [/api/v1/tours/:id/:y?]
// called mounting router

// 3) ROUTES
app.use("/", viewRouter); // for views

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

//handel not hit routes  ---- handel all routes that not responded from the upper routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // whenever pass something to next it  will be an error to skil all other next middle ware till go to ERROR MIDDLE WARE HANDELER
});

//ERROR HANDELING MIDDLEWARE
app.use(golbalErrorHandler);

module.exports = app;
