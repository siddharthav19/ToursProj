const Review = require('./../models/reviewModel');
const catchAsyncError = require('../Utils/catchAsyncError');

exports.getAllReviews = catchAsyncError(async (req, res, next) => {
  let objfiltered = {};
  if (req.params.tourId) objfiltered = { tour: req.params.tourId };
  const reviews = await Review.find(objfiltered);
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
    }
  });
});

exports.createReview = catchAsyncError(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.userDetails.id;
  const review = await Review.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      review
    }
  });
});
