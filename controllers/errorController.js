const AppError = require("./../utils/appError");
const handelCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handelDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name;
  const message = `Dublicate field value: '${value}'. Please use another value!`;
  return new AppError(message, 400);
};
const handelValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handelJWTError = () =>
  new AppError(`Invalid token, please log in again!`, 401);

const handelJWTExpiredError = () =>
  new AppError(`Your token has expired, please log in again!`, 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) this for render pages - render website
  console.error("ERROR 🔥", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    // Operational, trusted error : send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // Programming or other unknown error: don't leak error details
    // 1) Log Error
    console.error("ERROR 🔥", err);
    //2) Send generic message
    return res.status(500).json({
      status: "error",
      message: "Something went very worng!",
    });
  }

  // B) for render website
  // Operational, trusted error : send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }

  // Programming or other unknown error: don't leak error details
  // 1) Log Error
  console.error("ERROR 🔥", err);
  //2) Send generic message
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: "Please try again later.",
  });
};

module.exports = (err, req, res, next) => {
  //console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  //console.log("NODE_ENV:", process.env.NODE_ENV);

  if (process.env.NODE_ENV.trim() === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV.trim() === "production") {
    let error = { ...err }; //hard copy of error
    error.name = err.name; /// assigining name it didn't copied by hard copied
    error.message = err.message;

    if (error.name === "CastError") error = handelCastErrorDB(error);
    if (error.code === 11000) error = handelDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handelValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handelJWTError();
    if (error.name === "TokenExpiredError") error = handelJWTExpiredError();
    sendErrorProd(error, req, res);
  }
};
