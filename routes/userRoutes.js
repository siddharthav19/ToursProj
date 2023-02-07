const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');

const router = express.Router();

//we can also write like

// router.route('/signup').post(authController.signup);

//standard for signup and login should be accessed via post http method and doesnot match the REST architecture

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.post('/forgot-password', authController.forgotPassword);

router.patch(
  //patch cuz you are updating password
  '/updatePassword',
  authController.protectRoutes,
  authController.updatePassword
);

//patch here in reset token because you will be modifying the password which is in the document

//authController.protectRoutes is for verifying the jwt as update me is a protectedRoute
//myprofile for updating email or name or delete(deactivate) his account
router.patch(
  '/myprofile',
  authController.protectRoutes,
  userController.updateMe
);

router.delete(
  '/myprofile',
  authController.protectRoutes,
  userController.deleteUser
);

router.patch('/reset-password/:token', authController.resetPassword);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
