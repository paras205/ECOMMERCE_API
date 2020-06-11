const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');

const app = express();
app.use(express.json());
app.use(cors());
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/product', productRoutes);

module.exports = app;
