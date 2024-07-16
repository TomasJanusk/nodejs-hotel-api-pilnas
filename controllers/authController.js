const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    res.status(201).json({
      status: "success",
      data: newUser,
      token,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    //1. Check email and password exist
    if (!email || !password) {
      throw new Error("Please provide email and password");
    }
    //2. Check is user and password correct
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new Error("Incorrect email or password");
    }
    const token = signToken(user.id);
    //3. If everything is ok, send a token to client
    res.status(201).json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token: token,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1. Get token
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      throw new Error("User is not authentificated");
    }

    // 2. Token verification
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // 3. Check user exist
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      throw new Error("User doesn't exist");
    }
    // 4. Check user changed password after token was issued
    if (currentUser.changePasswordAfter(decoded.iat)) {
      throw new Error("User changed password, token is invalid");
    }
    // Grant access
    req.user = currentUser;
    next();
  } catch (err) {
    res.status(400).json({
      status: "failed",
      error: err.message,
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "failed",
        message: "You don't have permissions for this action",
      });
    } else {
      next();
    }
  };
};
