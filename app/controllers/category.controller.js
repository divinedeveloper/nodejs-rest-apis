const Category = require('../models/category.model.js');

// Create and Save a new Category
exports.create = async (req, res) => {

    // Validate request
    if(!req.body.name) {
        return res.status(400).send({
            message: "Category name can not be empty"
        });
    }

    category_name = req.body.name.trim()
    parent_path = req.body.parent.trim() || "/"
    

    var category
    if(parent_path == "/"){
        //If parent category is root
        current_category_path = parent_path + category_name

        // Create a Category
        category = new Category({
            name: category_name,
            parent: parent_path, 
            category: current_category_path
        });

    }else{
        // if not root then
        // validate the parent category exists in db or not throw error if any parent is missing
        var parent_category = await Category.findOne({name: parent_path}).exec();
        if(!parent_category){
            return res.status(404).send({
                message: `Parent category ${parent_path} not found `
            });
        }

        // Create a Category
        category = new Category({
            name: category_name,
            parent: parent_category.category, 
            category: parent_category.category + "/" + category_name
        });

    }
    
    // Save Category in the database
    category.save()
    .then(data => {
        res.send(data);
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while creating the Category."
        });
    });

};

// Retrieve and return all categories with all child categories from the database.
exports.findAll = (req, res) => {

};

