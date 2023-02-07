const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// router
//   .route('/controllers:tourId/reviews')
//   .post(
//     authController.protectRoutes,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

// router.param('id', (req, res, next, val) => {
//   console.log(`Tour id is ${val} from Param Middleware`);
//   next();
// });

// router.param('id', tourController.checkID);

// create a checkBody middleware
// check if body contains the name and price property
// if not send back a 400(bad request) response
// add it to post handler stack

// always declare routes with variables atlast

//?router params merge

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-Tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

// tourController.aliasTopTours is an middleware we are modifying the request object with the help of the middleware

//for getting statistics of tours data using aggregation pipeline we implemented

router.route('/tours-statistics').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

//protecting the getAllTours resource basically we are trying to implement get all tours for the users who are authorised and authenticated

router
  .route('/')
  .get(authController.protectRoutes, tourController.getAllTours)
  .post(tourController.createTour);

// .post(tourController.checkBody, tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protectRoutes, //middleware which will run before restrictTo middleware and deleteTour controller
    authController.restrictTo('admin', 'lead-guide'), //middleware which will run before deleteTour controller
    tourController.deleteTour
  );

module.exports = router;
// +44 117 318 2659
