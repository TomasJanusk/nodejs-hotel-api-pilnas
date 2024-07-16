const Hotel = require("../models/hotelModel");

//Routes functions

exports.getAllHotels = async (req, res) => {
  try {
    //Filtering
    const queryObj = { ...req.query };
    const excludedFields = ["sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    //Advanced filtering

    let queryStr = JSON.stringify(queryObj); //convert to string
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //add $ sign to operator
    console.log(JSON.parse(queryStr)); //console and parse string from query obj

    let query = Hotel.find(JSON.parse(queryStr));

    //Sorting

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }
    //Field limiting

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    }

    //Execute query

    const hotels = await query; //filter using mongo compare operators
    res.status(200).json({
      status: "success",
      results: hotels.length,
      data: {
        hotels,
      },
    });
  } catch (err) {
    console.log(err);
  }
};

exports.createHotel = async (req, res) => {
  try {
    const newHotel = await Hotel.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        hotel: newHotel,
      },
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getHotelById = async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) {
    return res.status(404).json({
      status: "failed",
      message: "Invalid ID",
    });
  }
  res.status(200).json({
    status: "success",
    data: {
      hotel,
    },
  });
};

exports.updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: "success",
      data: {
        hotel,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      data: {
        message: err,
      },
    });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id);
  } catch (err) {
    console.log(err);
  }
  res.status(200).json({
    status: "success",
    data: {
      hotel: null,
    },
  });
};
