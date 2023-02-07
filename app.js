const express = require('express'); //main express
const morgan = require('morgan'); //logging middleware
const rateLimit = require('express-rate-limit'); //responsible for implmenting rate limiting
const helmet = require('helmet'); //helps in sending response with safety headers
const mongoSanitize = require('express-mongo-sanitize'); //data sanitization prevents from NoSQL injection attack
const xss = require('xss-clean'); //prevents from XSS attacks
const hpp = require('hpp'); //prevents attacks which may rise from parameter pollution (whitelists our wished props which may come in queryStrings as fields)

//* if the server restarts => then rate limiter history will be cleared (internally it would store it in some map kinda thing)

const app = express();

//order of middleware code we write in nodejs or express highty effects it's execution but in mongoose order doesnot depend on execution

// const { json } = require('express');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const AppError = require('./Utils/AppError');

const globalErrorHandler = require('./controllers/errorHandler');
//this file is for express app
//this file or app.js file will mostly contain imports/require and middlewares

console.log('environment :', process.env.NODE_ENV);

// 1 MIDDLEWARE
//morgan as logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); //ok morgan
}

// in every middleware we should pass the reference of the middleware function and we should not call the middleware function
// and here in helmet() and express.json() case we will call them and they will return the middleware function(cuz they are implemented like that) so atlast effectively the reference to the middleware function will be stored
//
//* helmet package for setting security headers and implementing them
app.use(helmet()); //put this middleware in the starting of our application for effective functioning

//* express-mongo-sanitize for data sanitization to prevent NoSQL injection attacks
app.use(mongoSanitize());

//* xss-clean for data sanitization to prevent xss attacks
app.use(xss());

//* hpp to prevent parameter pollution
//* if we pass sort=price&sort=ratingsAvg mongoose will convert it into array as sort=[price,ratingsAvg] it doesnot make sense to sort on price and withou considering previously sorted order to sort on ratingsAvg (it's not saying here to sort on price and if collision occurs then sort on ratingsAvg for that syntax would sort=price,ratingsAvg)
//* we used some string methods in implementing sorting but those wont work on arrays ans we will get error so we need to prevent this
//* hpp will remove all those duplicate fields or fields which are sent as multiple fields in the query string
//? like if it sort=price & sort=ratingsAvg it will get overriden into sort=ratingsAvg only
//* if we are setting duration=5&duration=9 (give me tours which has duration as 5 or 9) but here also gets overriden to duration=9
//! so to prevent this we pass in an obj which has a whitelist property which will hold the list of fields to NOT to OVERRIDE
//! so duration=5&duration=9 will still stay as duration=5&duration=9 by passing whitelist:['duration',someotherproperties] as field in the obj
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuanity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

//?express.json() or bodyParser for reading the body and placing it in req.body
//?limit to restrict the data that can be sent in the body here we can send 10kb at max in the body
app.use(express.json({ limit: '10kb' })); //middleware in patch request to get req.body
//middleware to serve static files
app.use(express.static(`${__dirname}/public`)); //middleware to serve static files

//
//rate limiting
//this limitRequests is an middleware function which is created and returned by rateLimit/express-rate-limit package
const limitRequests = rateLimit({
  max: 100, //*max 100 requests allowed per ip(IP ADDRESS) for every 60*60*1000 milliseconds or 1 hour
  windowMs: 60 * 60 * 1000, //milliseconds
  message: 'Too many requests please try again after an hour'
});

//?*!
//*app.use((req,res,next)=>{ ........ }) this will be called for every request
//*app.use('/api',router or middleware function) this will be called only for requests which is requesting a resource starting with /api
//?*!

app.use('/api', limitRequests);

//
app.use('/api', (req, res, next) => {
  console.log(
    'THIS MIDDLEWARE WILL BE CALLED IF THE REQUESTED PATH STARTS WITH /api'
  );
  next();
});

//custom middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development')
    console.log('Hello from Middleware 👋');
  next();
});

app.use((req, res, next) => {
  req.requestedAt = new Date().toISOString();
  //VERY IMPORTANT 💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥
  //if there is an error in the middleware then it straight away goes to the error handling middleware 🔥🔥
  //logging request headers
  console.log('request headers :', req.headers);
  next();
});

//3 ROUTES

//mounting routes or creating sub applications and attaching them with the help of middleware
app.use('/api/v1/tours', tourRouter); //*? if  the reques matches this path "/api/v1/tours" then it will go into router named tourRouter and also not only router we can also use middleware functions also similarly these middle functions will be called if the request starts with "/api/v1/tours"
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//all means it is for any of the http methods

// app.use('*', (req, res, next) => {
// app.use( (req, res, next) => {
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `can't find ${req.originalUrl} on this server`
  // });
  //
  // with global error handling
  // const err = new Error(`can't find ${req.originalUrl} on this server`);
  // err.statusCode = 404;
  // err.status = 'fail';
  // next(err);
  //
  //with custom error class
  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

// if you pass any argument to the next function next(err) then express detects that passed argument is an error and it will skip every other normal middleware until it reaches the error handling middleware and treats the passed argument as an error
// if a middleware has 4 arguments then it is a error handling middleware

app.use(globalErrorHandler);

module.exports = app;
