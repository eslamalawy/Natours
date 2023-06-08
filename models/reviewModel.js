// review / rating / createdAt / ref to tour / ref to user
const mongoose = require("mongoose");
const Tour = require("./tourModel");
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"],
    },
    rating: {
      type: Number,
      min: [1, "min value is 1.0"],
      max: [5, "max value is 5.0"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour."],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user."],
    },
  },
  {
    // options
    toJSON: { virtuals: true }, // all this does is to make sure that when we have a vertual property (basicly is a field that not stoerd inn the database but calculated by other values) so we want it to show up whenever where an output
    toObject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: "tour",
  //     select: "name", //just the name
  //   }).populate({
  //     path: "user",
  //     select: "name photo", // just the name photo
  //   });

  this.populate({
    path: "user",
    select: "name photo", // just the name photo
  });
  next();
});

//static method in mongo
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    // select all reviews related to this tour
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  // console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
// just one review for each user on a tour
// compound between tour and user should be unique
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // doesn't matter that 1 or -1 here 

reviewSchema.post("save", function () {
  //this points to current review
  //this.constructor // points to the Review model
  this.constructor.calcAverageRatings(this.tour); // we used this because to have it in the Review model it should be before the Review Declaration and we canno't access the Review model before the declaration so we got the model from the review document using this.constructor
});

// findByIdAndUpdate  --> short hand for findOneAndUpdate
// findByIdAndDelete  --> short hand for findOneAnd
// no pre middle ware for these events let's get them by other way
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // [this] here refare to the current query
  //const r = await mythis.findOne(); // cannot work because mongoose prevented dublicating queries
  this.r = await this.model.findOne(this.getQuery());
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
