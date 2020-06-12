const express = require('express');
const productController = require('../controllers/product');
const authController = require('../controllers/auth');

const router = express.Router();

router.route('/category').post(productController.createCategory).get(productController.getAllCategories);
router.route('/').post(productController.createProduct).get(productController.getAllProducts);
router.route('/:productId/add-to-cart').post(authController.protect, productController.addToCart);
router.route('/get-cart').get(authController.protect, productController.getCartItems);
router.route('/search').post(productController.searchProduct);
router
	.route('/checkout')
	.post(authController.protect, productController.createOrder)
	.get(authController.protect, productController.getAllOrders);

module.exports = router;
