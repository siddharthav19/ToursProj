/*eslint-disable*/
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString }; //deep copying this.queryString into queryObj
    const excludedFields = ['sort', 'page', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);
    //1AA Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    //converting obj to string
    //regex to [gt] in query string
    queryStr = queryStr.replace(/\b(lte|lt|gte|gt)\b/g, matched => {
      return `$${matched}`;
    });
    //BUILD A QUERY
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  //?lets say i want to sort by price(ascending order) and if there is a tie sort them based on their ratings average(ascending order)
  //?in query string we will send it as ?sort=price,ratingsAvg(comma seperated)
  //?and also we will recieve it as sort=price,ratingsAvg in the request(comma seperated)
  //?in mongoose if we want to sort based on onefield say it price will use Model.sort('price')
  //?!and if we want to sort based on two values (let's say price and ratingsAvg) Model.sort('price ratingsAvg') seperated with space
  //split with comma and join with space
  sort() {
    //2 Sorting  //sort method takes an string as an argument and the string contains fields based on which we perform sorting
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' '); //*split with comma join with space
      //sort('price ratingsAvg') syntax to sort price in asc order and ratingsAvg also in asc order
      console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else this.query = this.query.sort('_id');
    return this;
  }

  limitFields() {
    //3 limiting fields
    if (this.queryString.fields) {
      const limiting = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(limiting);
    } else this.query = this.query.select('-__v');
    return this;
  }

  paginate() {
    //4 Pagination

    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
