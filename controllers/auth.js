const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const sendEmail = require('../utils/email');
const AppError = require('../utils/appError');

const signToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES
	});
};

exports.register = async (req, res) => {
	try {
		const user = await User.create({
			name: req.body.name,
			email: req.body.email,
			password: req.body.password,
			passwordConfrim: req.body.passwordConfrim
		});
		const token = signToken(user._id);
		res.status(201).json({
			status: 'success',
			token,
			user
		});
	} catch (err) {
		console.log(err);
	}
};

exports.login = async (req, res, next) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return next(new AppError('Please enter and password', 400));
		}
		const user = await User.findOne({ email }).select('+password');
		if (!user || !await user.comparePassword(password, user.password)) {
			return next(new AppError('Incorrect email or password', 401));
		}
		const token = signToken(user._id);
		res.status(201).json({
			status: 'success',
			token,
			user: user.name
		});
	} catch (err) {
		console.log(err);
	}
};

exports.forgotPassword = async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email });
	if (!user) {
		return next(new AppError('There is no user with this email', 404));
	}
	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });
	const resetlURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
	const message = `Forgot your password? submit a PATCH request with your new password and password confirm to the ${resetlURL}`;
	try {
		await sendEmail({
			email: user.email,
			subject: 'Your password reset token (valid for 10 min)',
			message
		});
		res.status(200).json({
			status: 'success',
			message: 'Token send to email'
		});
	} catch (err) {
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateBeforeSave: false });
		return next(new AppError('There was an error sending an error. Try again later', 500));
	}
};
exports.resetPassword = async (req, res, next) => {
	try {
		const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
		const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
		if (!user) {
			return next(new AppError('Token is invalid or expired', 400));
		}
		user.password = req.body.password;
		user.passwordConfrim = req.body.passwordConfrim;
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		const token = signToken(user._id);
		res.status(201).json({
			status: 'success',
			token
		});
		await user.save();
	} catch (err) {
		console.log(err);
	}
};
exports.changePassword = async (req, res, next) => {
	const user = await User.findById(req.user.id).select('+password');
	if (!await user.comparePassword(req.body.passwordConfrim, user.password)) {
		return next(new AppError('Password is not correct', 401));
	}
	user.password = req.body.password;
	user.passwordConfrim = req.body.passwordConfrim;
	const token = signToken(user._id);
	await user.save();
	res.status(201).json({
		status: 'success',
		token
	});
};

exports.protect = async (req, res, next) => {
	try {
		let token;
		if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
			token = req.headers.authorization.split(' ')[1];
		}
		if (!token) {
			return next(new AppError('Unauthorized', 401));
		}
		let decoded;
		try {
			decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
		} catch (err) {
			res.status(401).json({
				status: 'fail',
				message: 'Invalid token'
			});
		}
		const currentUser = await User.findById(decoded.id);
		if (!currentUser) {
			return next(new AppError('The user belongs to token does not exists', 401));
		}

		req.user = currentUser;
		next();
	} catch (err) {
		console.log(err);
	}
};

exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			// 403 => forbidden
			return next(new AppError('You do not have permission to perfom this action', 403));
		}
		next();
	};
};
