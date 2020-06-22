const mongoose = require('mongoose');

const CategorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true,
        unique: true,
        trim: true
      },
    //The parent category path. If the parent is the root it will be /
    parent: {
        type: String,
        required: true,
        trim: true
      },
    //The current category path
    category: {
        type: String,
        required: true,
        trim: true
      }
}, {
    timestamps: true
});

module.exports = mongoose.model('Category', CategorySchema);
