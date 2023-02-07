const express = require('express');

const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');

//mergeParams router
//basically by using merge params we still get access to the parameters of previous mounted parent router or applications
//?we get access to all variables in req.params in the entire URL from starting of localhost:3000/(starting from here)

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReviews)
  //only letting logged in users posting reviews
  .post(
    authController.protectRoutes,
    authController.restrictTo('user'),
    reviewController.createReview
  );

module.exports = router;
