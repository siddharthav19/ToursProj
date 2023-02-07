//all the functions or methods related to authentication should be implemented in this file
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../Utils/AppError');
const User = require('./../models/userModel');
const catchAsyncError = require('./../Utils/catchAsyncError');
const sendEmail = require('../Utils/email');

//token will be madeup of payload and header and signature and signature = payload + header + secret string
// here process.env.JWT_SECRET_KEY is the secret string
const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const sendToken = (newUser, statusCode, res) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRESIN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  newUser.password = undefined; //this will prevent the password from getting displayed in the response
  const token = signToken(newUser._id);
  // setting a cookie or sending a cookie along with the response
  // the first arg is cookieName you can havc=e anything as the cookie name
  //2nd arg is the value that you want to send as the cookie
  //3rd arg is an object of options or COOKIEOPTIONS
  //in cookie options by setting httpOnly:true we are saying that this cookie wont be modified or accessed by anyone
  //and by setting secure:true we are saying that this cookie should be transferred over secure connection only(HTTPS/SSL)
  //demonstrating how we can send jwt inside cookie
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token: token,
    data: {
      user: newUser
    }
  });
};

exports.signup = catchAsyncError(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });

  // the value of JWT_SECRET_KEY should be atleast 32 characters long

  // const token = signToken(newUser._id);
  // res.status(201).json({
  //   status: 'success',
  //   token: token,
  //   data: {
  //     user: newUser
  //   }
  // });
  sendToken(newUser, 201, res);
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  //1) check email and password actually exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //2) checking whether user with the given email exists
  const user = await User.findOne({ email: email }).select('+password');
  // console.log(user);
  //3) verifying whether the given password is actually correct by using the instance method we defined on the UserSchema
  //instances method are defined on the schema and will be available on all documents
  //SchemaName.methods.nameOfInstanceMethod

  if (!user || !(await user.checkCorrectPassword(password, user.password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  //sending the token
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
  sendToken(user, 200, res);
});

exports.protectRoutes = catchAsyncError(async (req, res, next) => {
  //basically checking whether a user logged in or not if he is logged in then checking his token whether he is an actual user and not a malicious user based on his token and payload
  //1) Getting token and check if it's there

  //basically the client will send the token inside the header
  //and the standard way is to send the token in the header with the property name as authorization and value as Bearer +" "+JWT_TOKEN
  // console.log(req.headers);
  let token = '';
  //req.headers contains the headers that are sent with request
  //OOABAA basically the jwt will be sent as a header in the authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    //req.headers.authorization = Bearer+" "+JWT_TOKEN so splitting with space
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    // throw new AppError(
    //   'You are not logged in! Please log in to get access',
    //   401
    // );

    //or we can also do like this

    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }
  // console.log(token);
  //2) verification of token

  //promisifying the jwt verify method
  const decodedDetails = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );

  //in this above step we are verifying the token using jwt.verify method the arg is token we want verify and the secretString we used to create the token

  //the above step basically verifies whether the payload has been changed or not and whether the token is expired or not
  //in this example we kept the user id (ObjectId =>(_id of the document in the mongodb)) as the payload
  //if the payload has been changed or modified then or if the token gets expired the jwt.verify method will throw an error
  //handle those corresponding errors accordingly in the global error handling controller

  const currentUser = await User.findById(decodedDetails.id);

  //3) check if user still exists
  if (!currentUser)
    return next(
      new AppError('User belonging to this token no longer exists', 401)
    );

  //4) check if user changed password after token was issued
  //if the user has changed the password at x time then token issued before x time should not get verfied and not be granted with the protected route/resources

  //true means changed password after token issued
  //false means not changed password after token issued
  //iat in the token payload contains the timestamp at which the token is issued
  if (currentUser.changedPasswordAfterTokenCreated(decodedDetails.iat)) {
    next(
      new AppError('User Changed the password recently!Please login again', 401)
    );
  }

  //GRANT ACCESS TO THE PROTECTED ROUTE
  req.userDetails = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userDetails.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('No user with that email', 404));
  }

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateModifiedOnly: true });
  //as we have modified the document in the createPasswordResetToken instance method and we didn't save that we have to save it
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  const message = `Forgot your password? submit a PATCH request with your 
  new password and passwordConfirm to : \n${resetURL}\n if you didn't forgot
  your password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message: message
    });
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateModifiedOnly: true });
    return new AppError(
      'There is an Error sending the email,Please Try again Later',
      500
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to Email'
  });
});

exports.resetPassword = catchAsyncError(async (req, res, next) => {
  //TODO    1) get User based on the reset token we issued

  //two same values will be hashed to the same values
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //? we are finding the user based on the resetToken we assigned him in the forgot password route bcz we don't know anything about the user now except this token (we don't know email also as we asked user to send a patch req to this endpoint with req.params i.e, parameter as token to this route)
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() }
  });

  //? in the above piece of code we are checking or user with a matching hash and whose passwordResetToken is not expired

  //? We have encrypted the resetToken with the crypto library and we encrypted at medium level
  //? so then how to compare so ans is hash this string also in the same way and after that compare
  // ? string which is hashed just now to the string which we wanted to compare with

  //TODO    2) if Token is not expired and the user exists then set new password

  //! 400 => BAD REQUEST

  if (!user) {
    return next(new AppError('Token is Invalid or Expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save({ validateModifiedOnly: true }); //validateModifiedOnly: true this is your holy bible for validating the modified fields
  //TODO    3) update passwordChangedAt property for that user
  //TODO     this 3rd we now implemented this in the Model as an pre save middleware function
  //TODO    4) Log the User in , (send JWT)
  // const jwtToken = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token: jwtToken
  // });
  sendToken(user, 200, res);
});

exports.updatePassword = catchAsyncError(async (req, res, next) => {
  //user will update the password when he is logged in for this the user needs to send his current password
  //1) Get the user from db/collection

  const { passwordCurrent, newPassword } = req.body;
  // const { newPassword } = req.body;

  const user = await User.findById(req.userDetails.id).select('+password');

  //no need to check as user is already logged in
  // if (!user) {
  //   throw new AppError('No user exists with the given email');
  // }
  //! User.findByIdAndUpdate will not as expected as the document pre middleware and validators wont run if we update

  //2) Check if POSTed password is correct

  if (!(await user.checkCorrectPassword(passwordCurrent, user.password))) {
    throw new AppError('No user exists with given password and email');
  }

  //3) If it is correct then update the password

  user.password = newPassword;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save({ validateModifiedOnly: true });

  //4) Log the user in (SEND BACK JWT as the password is updated)

  // const tokenJWT = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token: tokenJWT
  // });
  sendToken(user, 200, res);
});

// $2a$12$LiH91778mZPuirpVou/akuUYhWBXvyw5xzYv/gxRK57sajgc81A0m
