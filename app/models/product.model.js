const mongoose = require('mongoose');

const ProductSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true,
        unique: true,
        trim: true
      },
    price: {
        type: Number,
        required: true
      },
    currency: {
        type: String,
        required: true,
        trim: true
      },
      
    // An embedded array of category paths for this product. A product can belong to one or more categories 
    // TODO : add index to categories for fast searching 
    categories: [String]
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
