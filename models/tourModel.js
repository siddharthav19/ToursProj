const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

//enum validator is available only for strings
//range validators min and max for numbers and minlength and maxlength for strings

//schema of a document like how a document should look like or what all are all the things a document should contain
//defining the schema

//if you want to add some fiels in later using the middleware then also to add first it should d=be defined in the schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must be less than or equal to 40 chars'],
      minlength: [9, 'A tour name must be above 10 chars']
      // validate: { //for example sake
      //   validator: validator.isAlpha,
      //   message: 'A tour must contain only letter from a-z or A-Z'
      // }
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'ERROR => Difficulty must be either : easy ,medium ,difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1.0, `A tour's avg rating must be above 1.0`],
      max: [5.0, `A tour's avg rating must be below 5.0`]
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        message:
          'A tour must have discount price ({VALUE}) less than regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: true
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now()
    },
    startDates: {
      type: [Date] //array of dates
    },
    slug: String,
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GeoJSON
      //to specify the startLocation as GeoJSON we need to specify two properties
      //type and coordinates and we can also extra peoperties other than this
      type: {
        type: String,
        default: 'Point',
        enum: {
          values: ['Point'],
          message: 'type can only be Point'
        }
      },
      coordinates: [Number],
      description: String,
      address: String
    },
    //* TO EMBED DATA  (BASICALLY CREATE NEW DOCUMENTS AND STORE THOSE DOCUMENTS IN THE CURRENT DOCUMENT WE NEED TO CREATE A PROPERTY LIKE BELOW )
    //* Locations as an embedded property create an array with objects then mongodb will create new documents
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        description: String,
        address: String,
        day: Number
      }
    ],
    //implementing child referencing
    // saying that this will contain array of elements and each will be of type ObjectId and will reference to the Users collection
    //img:[String] is same as img:[{type:String}]
    //
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//    toJSON: { virtuals: true },
// toObject: { virtuals: true }
// we set the above two properties to true to tell that we will be requiring virtual properties / those two options are on switch for using virtual properties

//virtual properties we don't want to store all the properties which can be calculated from other properties so we calculate these values from existing values and put them in the documents just before sending documents to the user or client we can do this in the controllers also but we are doing it in the schema section only because we want to seperate the business logic and application logic as much as possible and to implement fat model and thin controller architecture

//we are using a normal function because arrow function doesnot have it's own this keyword and here the this is pointing towards the documents

//syntax of defining a virtual property

//virtual property should not be defined in the schema
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});
//VIRTUAL POPULATE

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

//just like virtual properties middleware should be defined on the schema

//DOCUMENT MIDDLEWARE IN MONGOOSE : THIS pre middleware is gonna run just before .create() or .save() method and not gonna run for update or before creating or saving the document and  the middlewares associated with 'save' are not gonna run for .insertMany() or .updateMany()

//the pre hook / pre save document have access to this keyword and next function

//we can have multiple pre/post  middlewares on the same hook

tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, {
    lower: true
  });
  next();
});

// tourSchema.pre('save', function(next) {
//   console.log('Will save the document');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  //remove presence of secretTours in the result documents for the user
  //this hook will execute only for find but doesnot execute for findOne like findById which is internally findOne so use a regex for matching any query which starts with find
  //has access to this keyword and this points to the current query
  this.find({ secretTour: { $ne: true } });
  this.timeStart = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.timeStart} milliseconds`);
  // console.log(docs);
  next();
});

//Aggregation middleware

tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

//we will have the Model ans schema  in this folder nothing other than that

//then where will we work with data like create Docs Read Docs update Docs delete Docs answer to this is in respective controller folder

//creating a model from an schema

//just ofr testing purpose
// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997
// });

// testTour
//   .save()
//   .then(doc => console.log(doc))
//   .catch(err => console.log('Error 💥', err));

module.exports = Tour;
