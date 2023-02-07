// const fs = require('fs');

const User = require('../models/userModel');
const catchAsyncError = require('../Utils/catchAsyncError');
const AppError = require('./../Utils/AppError');

//response or request handlers are also called as controllers

// const usersData = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/users.json`)
// );

exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  // res.status(200);
  // res.json({
  //   status: 'success',
  //   length: usersData.length,
  //   data: {
  //     users: usersData,
  //   },
  // });
  // //status 500 == INTERNAL SERVER ERROR
  // res.status(500).json({
  //   status: 'error',
  //   message: 'This route is not yet implemented'
  // });

  const users = await User.find();
  res.status(200).json({
    status: 'success',
    data: {
      users
    }
  });
});

//* FOR THE USER TO UPDATE HIS DETAILS (NAME AND EMAIL) NOTE: PASSWORD WONT BE UPDATED HERE AS IT BELONGS TO SENSITIVE DATA SO WE IMPLEMENT THAT BY AUTHENTICATING < AUTHORIZING IN THE AUTHENTICATION CONTROLLER
//* HERE WE WILL UPDATE THE DETAILS RELATED TO USER/ACCOUNT ITSELF BUT WE WONT UPDATE PASSWORD HERE

const filterObj = (obj, ...options) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (options.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.updateMe = catchAsyncError(async (req, res, next) => {
  //1) if he(user) tries to update password create error || create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates ,please use /api/v1/users/updatePassword',
        400
      )
    );
  }

  // console.log(req.userDetails);
  //2) filter the req.body for unwanted fields
  const filteredObj = filterObj(req.body, 'name', 'email');

  //3) update document
  const newUpdateUser = await User.findByIdAndUpdate(
    req.userDetails.id,
    filteredObj,
    {
      new: true,
      runValidators: true
    }
  );

  //you can do the above using user(doc).save({validateModifiedOnly:true})   =>(saviour) instead of using confusing User(model).findByIdAndUpdate
  //
  //

  res.status(200).json({
    status: 'successful',
    data: {
      user: newUpdateUser
    }
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet implemented'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet implemented'
  });
};
exports.createUser = (req, res) => {
  // console.log(req.body);
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet implemented'
  });
};

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  await User.findByIdAndUpdate(req.userDetails.id, { active: false });
  res.status(204).json({
    status: 'success'
  });
});
