const mongoose = require('mongoose');

const orderProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const orderSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  products: [orderProductSchema],
  status: {
    type: String,
    enum: ['En attente', 'Traitée'],
    default: 'En attente'
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
