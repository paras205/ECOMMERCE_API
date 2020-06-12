const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	image: {
		type: String
	},
	description: {
		type: String,
		required: true
	},
	price: {
		type: Number,
		required: true
	}
});
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
