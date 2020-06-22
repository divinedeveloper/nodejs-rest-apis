const Product = require('../models/product.model.js');
const Category = require('../models/category.model.js');

// Create and Save a new Product
exports.create = async (req, res) => {

    // Validate request
    if(!req.body.name || !req.body.price || !req.body.currency || !(Array.isArray(req.body.categories) && req.body.categories.length))  {
        return res.status(400).send({
            message: "Product name, price, currency and categories can not be empty"
        });
    }

    productName = req.body.name.trim()
    currency = req.body.currency.trim()

    // check product name uniqueness
    var product_exists = await Product.exists({name: productName});
        if(product_exists){
            return res.status(409).send({
                message: `Product ${productName} already exists `
            });
        }

    // validate the parent category exists in db or not throw error if any parent is missing
    var categories = await Category.find({name: {$in : req.body.categories}}).exec();
    console.log(categories)

    let categoryNames = categories.map(category => category.name);

    var categoriesNotFound = req.body.categories.filter(e => !categoryNames.includes(e))

    if(Array.isArray(categoriesNotFound) && categoriesNotFound.length){
        return res.status(404).send({
            message: `Categories ${categoriesNotFound.toString()} not found `
        });
    }

    let categoryPath = categories.map(cat => cat.category);

    // Create a Product
    product = new Product({
        name: productName,
        price: req.body.price,
        currency: currency,
        categories: categoryPath
    });

    // Save Product in the database
    product.save()
    .then(data => {
        res.send(data);
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while creating the Product."
        });
    });
        
       
};

// Retrieve and return all products by category from the database.
exports.findAllByCategory = (req, res) => {

};


// Update a product identified by the productId in the request
exports.update = (req, res) => {

};


