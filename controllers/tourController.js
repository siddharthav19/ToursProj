const Tour = require('./../models/tourModel');
const APIFeatures = require('./../Utils/apiFeatures');
const catchAsyncError = require('./../Utils/catchAsyncError');
const AppError = require('./../Utils/AppError');
//create documents with mongoDB with a post request to Database (mongoDB and mongoose)
//final version of create tour

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'ratingsAverage,name,difficulty,price,summary';
  next();
};

exports.createTour = catchAsyncError(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.getAllTours = catchAsyncError(async (req, res, next) => {
  //req.query for query strings
  //req.body for the body sent in the request
  //req.paramsfor the parameters lile id (:id)
  const feature = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await feature.query;
  //SENDING RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours: tours
    }
  });
});

exports.getTour = catchAsyncError(async (req, res, next) => {
  // console.log(req.params, 'from getTour function/handler/controller');

  //will return query object
  //will return/resolved with document which matches the give id which is passed as an parameter
  const tour = await Tour.findById(req.params.id).populate({ path: 'reviews' });

  if (!tour) {
    return next(new AppError(`can't find tour with that ID`, 404));
  }

  //Tour.findById(req.params.id); is a shorthand for Tour.findOne({_id : req.params.id});

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour
    }
  });
});

exports.updateTour = catchAsyncError(async (req, res, next) => {
  //will return/resolved with updated document if new is set to true else if new is not set to true then it will be resolved with the old document

  //will replace the properties whose value is not same with data being passed that is req.body here cuz it's a patch request

  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tour) {
    return next(new AppError(`can't find tour with that ID`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour
    }
  });

  //findById and find and findByIdAndUpdate all of them will return query objects
  //first parameter is the id of the document you want to modify and second parameter would be the modified objectand third parameter is options object
  //if new is set to true in the third parameter which is options object, return the modified document rather than the original
});

exports.deleteTour = catchAsyncError(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return next(new AppError(`can't find tour with that ID`, 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getTourStats = catchAsyncError(async (req, res, next) => {
  const tours = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        //this _id properties value will define base based on which you want to do grouping if you want to have all the documents in a group then put _id : null and if we want to have groups based on difficulty then the syntax would be _id :'$difficulty' and groups will be formed which has same set of difficulty in one group and different values in many other groups
        //no || of groups possible = no || of unique possible values of grouping property variable in all the documents
        totalTours: { $sum: 1 },
        avgRating: { $avg: '$ratingsAverage' },
        numRatings: { $sum: '$ratingsQuantity' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgRating: 1 }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }

    //placing $ before the documents property names :: syntax
    //we can repeat stages as many time we want
    //once we group/aggregate documents then we won't have the documents properties will just have the accumulators defined in the group stage and _id set to property name's  different possible values which we used to group
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats: tours
    }
  });
});

exports.getMonthlyPlan = catchAsyncError(async (req, res, next) => {
  console.log(req.params.year);
  const year = Number(req.params.year);

  //will run on all documents in the Tour collection

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' }, //$month is an inbuilt mongodb method to get month from a date
        //to access variables of documents use $varname inside single quotes like this '$varname'
        totalTours: { $sum: 1 }, //this totalTours initially would be 0 for every group and this totalTours = totalTours + 1 will be called for every document in that group and this totalTours will be a group property not a individual doc property
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        totalTours: -1
      }
    },
    {
      $limit: 12
      //this will limit the groups to 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan: plan
    }
  });

  //
});
