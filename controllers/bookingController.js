const Tour = require("./../models/tourModel");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const Booking = require("./../models/bookingModel");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1) get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  //2) create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"], // should pay with card
    // success_url: `${req.protocol}://${req.get("host")}/my-tours/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`, // when he already payed the money

    success_url: `${req.protocol}://${req.get("host")}/my-tours`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`, // when he cancel the operation
    customer_email: req.user.email, // make operation easy for user to save him from entering email step
    client_reference_id: req.params.tourId, // to book the tour
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: tour.price * 100, // 100 cent
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`${req.protocol}://${req.get("host")}/img/tours/${tour.imageCover}`], // change it when being live production on hosted
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
  });

  //3) create session as response
  res.status(200).json({
    status: "success",
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // this is only TEMPERORAY, because it's UnSecure, everyone could create booking without paying
//   const { tour, user, price } = req.query;
//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });
//   res.redirect(req.originalUrl.split("?")[0]);
//   next();
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id; // tour id
  const user = (await User.findOne({ email: session.customer_email })).id; // need the id of the user
  const price = session.display_items[0].price_data.unit_amount / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    createBookingCheckout(event.data.object);
  }
  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
