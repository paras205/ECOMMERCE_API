const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const Category = require('../models/category');
const ApiFeatures = require('../utils/appFeatures');

exports.createCategory = async (req, res) => {
	try {
		const category = await Category.create(req.body);
		res.status(201).json({
			status: 'success',
			data: category
		});
	} catch (err) {
		console.log(err);
	}
};

exports.getAllCategories = async (req, res) => {
	try {
		const categories = await Category.find();
		res.status(200).json({
			status: 'success',
			data: categories
		});
	} catch (err) {
		console.log(err);
	}
};

exports.createProduct = async (req, res) => {
	try {
		const product = await Product.create(req.body);
		res.status(200).json({
			status: 'success',
			data: { product }
		});
	} catch (err) {
		console.log(err);
	}
};

exports.getAllProducts = async (req, res) => {
	try {
		const features = new ApiFeatures(Product.find(), req.query).paginate();
		const products = await features.query;
		res.status(200).json({
			status: 'success',
			page: features.queryString.page,
			result: products.length,
			data: products
		});
	} catch (err) {
		console.log(err);
	}
};
exports.getProductByCategory = async (req, res) => {
	try {
	} catch (err) {
		console.log(err);
	}
};
exports.searchProduct = async (req, res) => {
	try {
		const searchResult = await Product.find(
			{ $text: { $search: req.query.search } },
			{ score: { $meta: 'textScore' } }
		);
		res.status(201).json({
			status: 'success',
			data: searchResult
		});
	} catch (err) {
		console.log(err);
	}
};
exports.addToCart = async (req, res, next) => {
	try {
		const product = await Product.findById(req.params.productId);
		const cartItem = await req.user.addToCart(product);
		res.status(201).json({
			status: 'success',
			data: cartItem
		});
	} catch (err) {
		console.log(err);
	}
};
exports.getCartItems = async (req, res) => {
	try {
		const cartItems = await User.findById(req.user).populate({ path: 'cart.items.productId' });
		res.status(200).json({
			status: 'success',
			data: cartItems
		});
	} catch (err) {
		console.log(err);
	}
};

exports.createOrder = async (req, res) => {
	try {
		const user = await req.user.populate('cart.items.productId');
		const products = user.cart.items.map((item) => {
			return { quantity: item.quantity, product: { ...item.productId._doc } };
		});
		const order = new Order({
			user: req.user,
			products
		});
		await order.save();
		const result = await req.user.clearCart();
		res.status(201).json({
			status: 'success',
			data: result
		});
	} catch (error) {
		console.log(error);
	}
};

exports.getAllOrders = async (req, res) => {
	try {
		const orders = await Order.find({ user: req.user });
		res.status(200).json({
			status: 'success',
			data: orders
		});
	} catch (err) {
		console.log(err);
	}
};
