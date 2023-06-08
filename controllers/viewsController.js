const Tour = require("../models/tourModel");
const Booking = require("../models/bookingModel");
//const User = require("../models/userModel"); // for submit of form
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getOverview = catchAsync(async (req, res, next) => {
  //1) get all tour data from the collection
  const tours = await Tour.find();

  //2) build template
  //3) render that template using tour from step 1
  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1) get the dataa, for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  if (!tour) {
    return next(new AppError("There is no tour with that name", 404));
  }
  //2) build template
  //3) render templates using data from 1
  res.status(200).render("tour", {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res, next) => {
  res.status(200).render("login", {
    title: "Log into your account",
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1) find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  //2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } }); // instead of virtual populate like reviews the virual is better

  res.status(200).render("overview", {
    title: "My Tours",
    tours,
  });
});

//for form submit method
// exports.updateUserData = catchAsync(async (req, res, next) => {
//   const updatedUser = await User.findByIdAndUpdate(
//     req.user.id,
//     {
//       name: req.body.name,
//       email: req.body.email,
//     },
//     { new: true, runValidators: true }
//   );

//   res.status(200).render("account", {
//     title: "Your account",
//     user: updatedUser,
//   });
// });
