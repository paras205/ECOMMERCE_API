const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true
	},
	photo: String,
	role: {
		type: String,
		enum: [ 'user', 'admin', 'superAdmin' ],
		default: 'user'
	},
	password: {
		type: String,
		required: true,
		minlength: 8,
		select: false
	},
	passwordConfrim: {
		type: String
		// required: true
	},
	passwordResetToken: String,
	passwordResetExpires: Date,
	active: {
		type: Boolean,
		default: true,
		select: false
	},
	cart: {
		items: [
			{
				productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
				quantity: { type: Number, required: true }
			}
		]
	}
});

userSchema.methods.addToCart = function(product) {
	const cartProductIndex = this.cart.items.findIndex((cp) => {
		return cp.productId.toString() === product._id.toString();
	});
	let newQuantity = 1;
	const updatedCartItems = [ ...this.cart.items ];
	if (cartProductIndex >= 0) {
		newQuantity = this.cart.items[cartProductIndex].quantity + 1;
		updatedCartItems[cartProductIndex].quantity = newQuantity;
	} else {
		updatedCartItems.push({
			productId: product._id,
			quantity: newQuantity
		});
	}
	const updatedCart = {
		items: updatedCartItems
	};
	this.cart = updatedCart;
	return this.save();
};

userSchema.methods.clearCart = function() {
	this.cart = { items: [] };
	return this.save();
};

userSchema.pre('save', async function(next) {
	if (!this.isModified('password')) return next();
	this.password = await bcrypt.hash(this.password, 12);
	this.passwordConfrim = undefined;
	next();
});

userSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
	return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.createPasswordResetToken = function() {
	const resetToken = crypto.randomBytes(32).toString('hex');
	this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
	return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
