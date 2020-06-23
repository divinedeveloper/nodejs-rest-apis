const Product = require('../models/product.model.js');
const Category = require('../models/category.model.js');

// Create and Save a new Product
exports.create = async (req, res) => {

    // Validate request
    if(!req.body.name || !req.body.price || !req.body.currency || !(Array.isArray(req.body.categories) && req.body.categories.length))  {
        return res.status(400).send({
            message: "Product name, price, currency and categories cannot be empty"
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
exports.findAllByCategory = async (req, res) => {
    var requestedCategory = req.query.category.trim();
    var offset = parseInt(req.query.offset) || 0;
    var limit = parseInt(req.query.limit) || 10;

    var category = await Category.findOne({name: requestedCategory}).exec();
    if(!category){
        return res.status(404).send({
            message: `Category ${requestedCategory} not found `
        });
    }
    
    var products =  await Product.aggregate([
        {$sort: {name : 1}},

        {$match:{categories: category.category}},

        {$facet:{

            "stage1" : [ {$group : {_id:null, count:{$sum:1}}} ],
    
            "stage2" : [ { "$skip": offset}, {"$limit": limit} ]
    
          }},
    
         {$unwind: "$stage1"},
    
          //output projection
         {$project:{
            count: "$stage1.count",
            data: "$stage2"
         }}

    ]).exec();

    if(Array.isArray(products) && products.length){
        res.send(products);
    }else{
        res.json({"message": `No products found for category ${requestedCategory}`});
    }
};


// Update a product identified by the productId in the request
exports.update = async (req, res) => {

    // Validate request
    if(!req.body.name || !req.body.price || !req.body.currency)  {
        return res.status(400).send({
            message: "Product name, price, currency cannot be empty"
        });
    }

    productId = req.params.productId.trim()
    productName = req.body.name.trim()
    currency = req.body.currency.trim()

    var product = await Product.findById(productId).exec();
    if(!product){
        return res.status(404).send({
            message: "Product not found"
        });
    }

    var allCategories = []
    var finalCategories = []
    
    if (Array.isArray(req.body.excludeCategories) && req.body.excludeCategories.length){
        allCategories.push(...req.body.excludeCategories)
    }

    if (Array.isArray(req.body.includeCategories) && req.body.includeCategories.length){
        allCategories.push(...req.body.includeCategories)
        
    }

    if(allCategories.length){
        // validate all the categories exists in db or not throw error if any category is missing
        var categories = await Category.find({name: {$in : allCategories}}).exec();

        let categoryNames = categories.map(category => category.name);

        var categoriesNotFound = []

        var includeCategoriesNotFound = req.body.includeCategories.filter(e => !categoryNames.includes(e))
        categoriesNotFound.push(...includeCategoriesNotFound)

        var excludeCategoriesNotFound = req.body.excludeCategories.filter(e => !categoryNames.includes(e))
        categoriesNotFound.push(...excludeCategoriesNotFound)

        if(Array.isArray(categoriesNotFound) && categoriesNotFound.length){
            return res.status(404).send({
                message: `Categories ${categoriesNotFound.toString()} not found`
            });
        }
        var isCategoriesExcluded = false
        // remove excluded categories from product
        if(req.body.excludeCategories.length){
            var excludedCategories =  categories.filter(function(cat) {
                return req.body.excludeCategories.includes(cat.name);
            });
            let excludeCategoryPath = excludedCategories.map(cat => cat.category);

            filteredCategories = product.categories.filter(e => !excludeCategoryPath.includes(e))

            finalCategories.push(...filteredCategories)
            isCategoriesExcluded = true

        }

        // add new included categories to product
        if(req.body.includeCategories.length){
            var includedCategories =  categories.filter(function(cat) {
                return req.body.includeCategories.includes(cat.name);
            });

            let includeCategoryPath = includedCategories.map(cat => cat.category);

            if(isCategoriesExcluded){
                finalCategories.push(...includeCategoryPath)
            }else{
                finalCategories = product.categories.concat(includeCategoryPath)
            }
            
        }
    }
    
    //product udates
    product.name = productName
    product.price = req.body.price
    product.currency = currency
    if(finalCategories.length){
        //remove duplicate paths if any
        finalCategories = [...new Set(finalCategories)];

        product.categories = finalCategories
    }

    // Save Product in the database
    product.save()
    .then(data => {
        res.send(data);
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while updating the product."
        });
    });
};


