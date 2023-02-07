const crypto = require('crypto');
const mongoose = require('mongoose');
const checker = require('validator');
const bcrypt = require('bcryptjs');

// Operation `users.insertOne()` buffering timed out after 10000ms
//you may get this error in mongoose just wait for the db to get connected with the cloud db

//when you put required it means that piece of data is required as an input to the document while creating it and it is not compulsory to store the required fields in the database it is required as an input to document while creating that document only

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    //if we provide Sid@Gmail.com then it will convert it to sid@gmail.com basically converts this and email property or field to lowercase
    validate: {
      validator: checker.isEmail,
      message: 'Please provide a valid email'
    }
  },
  photo: {
    type: String
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin']
    },
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //this only works on save
      validator: function(val) {
        //this will work only on save
        //will be called whenever a new document is created
        //this keyword will point to the current doc which is created
        return val === this.password; //true means no validation error false means validation error
      },
      message: 'Passwords are not the same'
    },
    minlength: 5
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetTokenExpires: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

//middleware or anything should be defined on the schema not on the model

//here we are salting or hashing the password again whenever there is an update to the password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; //by setting a field to undefined we are basically not allowing to be stored in the document inside the database
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 2000; //so no issues will come after syncing the JWT iat(issued at) with doc saved in the db time like this
  next();
});

userSchema.pre(/^find/, function(next) {
  //query middleware
  //this points to the current query
  /**
   * *this.find({something here means }) it is a chained query cuz this will point to the current query
   * consider this =>
   *============> consider i am using await User.find({name:'jonas'})
   *============>  starts with find so this middleware gets executed then what internally happens is
   *============>  the query would become User.find({name:'jonas'}).find({ active: { $ne: false } }) after the query in query middleware attched to the this keyword will get executed
   *
   */
  this.find({ active: { $ne: false } });
  next();
});

// defining an instance method named checkCorrectPassword
//instance methods are available on all the documents

//comparing whether passwords are matching are not

userSchema.methods.checkCorrectPassword = async function(
  candidatePassword,
  userPassword
) {
  //bcrypt compare method will take password to be checked and correct hashed password and returns boolean true for password matching and false for password not matching
  return await bcrypt.compare(candidatePassword, userPassword);
};

//in the instance methods in mongodb(instance methods are the methods that are defined on the schema and available on all the documents and the this keyword points to the current document in the instance methos)
userSchema.methods.changedPasswordAfterTokenCreated = function(
  JWTIssuedTimeStamp
) {
  if (this.passwordChangedAt) {
    const timeStampPasswordChangedAt = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTIssuedTimeStamp < timeStampPasswordChangedAt;
  }

  //true means changed password after token issued
  //false means not changed password after token issued
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex'); //? generate a random string of 32 chars length

  this.passwordResetToken = crypto //?hash or encrypt upto medium level
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  // console.log(this.passwordResetToken, { resetToken });

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
//* validators and save middleware functions will run only for doc.save() and not for Model.findOneAndUpdate()
