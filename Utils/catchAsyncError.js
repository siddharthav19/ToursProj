// function to handle errors will take an function as an argument and returns a function in return if there is any error will propogate that error via next method to the gloabl error handling middleware

const catchAsyncError = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => {
      return next(err);
    });
    //this returning next(err) will propogate the error to the globalErrorHandler
  };
};

module.exports = catchAsyncError;
