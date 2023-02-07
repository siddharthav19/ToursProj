const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review should not be empty'],
      minlength: 3
    },
    rating: {
      type: Number,
      required: [true, 'review should have an rating'],
      validate: {
        validator: function(val) {
          return val <= 5.0 && val >= 1.0;
        },
        message:
          'review`s rating ({VALUE}) should be greater than 1 and less than or equal to 5'
      }
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A Review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.pre(/^find/, function(next) {
  // this.populate({ path: 'tour', select: 'name' })
  //   .populate({
  //     path: 'user',
  //     select: 'name photo'
  //   })
  //   .select('-__v');

  this.populate({
    path: 'user',
    select: 'name photo'
  }).select('-__v');

  next();
});

const reviewModel = mongoose.model('Review', reviewSchema);
module.exports = reviewModel;
