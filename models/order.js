const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
	products: [
		{
			product: { type: Object, required: true },
			quantity: { type: Number, required: true }
		}
	],
	user: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	}
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
