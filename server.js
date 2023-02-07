//this file will only contain data related to server like

// run nodemon server.js or run this file
// 1 server starting
// 2 database configurations
// 3 error handling
// 4 environment variables
// 5 This will be entry point or main file

const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION Shutting Down');
  console.log(err.name, err.message);
  process.exit(-1);
});

//The dotenv is a zero-dependency module that loads environment variables from a . env file into process. env

//!when this runs then only we can access all the variables inside of config.env file
dotenv.config({
  //should be before requiring the app
  path: './config.env'
});

const app = require('./app'); //this will first execute all the content which is inside of the app if there are any user defined modules required in the app those also will be run goes on and on and on so and when they run they cant get access to variables inside of the .config.env file so make sure to configure the config.env file using dotenv.config({path:'./config.env}) before requiring the app or main application

//mongoose

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// (async () => {
//   const dbObj = await mongoose.connect(DB, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//     useUnifiedTopology: true
//   });
//   console.log(dbObj.connections);
// })();

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB Connected Succesfully'));

// console.log(app.get('env'));
// console.log(process.env);

const PORT = process.env.PORT || 3000;
// 4 START SERVER
const server = app.listen(PORT, () => {
  if (process.env.NODE_ENV === 'development')
    console.log(`listening on port ${PORT}`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION Quitting the application');
  server.close(() => {
    process.exit(1);
  });
});

//TEST
