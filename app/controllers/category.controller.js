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
exports.findAll = async (req, res) => {

    var categories =  await Category.aggregate([
        { $match: {
            parent: "/"
        }},
        { $graphLookup: {
            from: "categories",
            startWith: "$category",
            connectFromField: "category",
            connectToField: "parent",
            as: "child_categories"
        }}

    ]).exec();

    let final_result = []

    function getNestedChildren(categories, category) {
        var out = []
        for(var i in categories) {
            if(categories[i].parent == category) {
                var children = getNestedChildren(categories, categories[i].category)
    
                if(children.length) {
                    categories[i].child_categories = children
                }
                out.push(categories[i])
            }
        }
        return out
    }
    if (categories.length >= 0) {   
        categories.map(single_doc => {  //For getting all parent Tree
            var single_child = getNestedChildren(single_doc.child_categories, single_doc.category)
            var obj = {
                _id: single_doc._id,
                name: single_doc.name,
                parent: single_doc.parent,
                category: single_doc.category,
                createdAt:single_doc.createdAt,
                updatedAt:single_doc.updatedAt,
                __v: single_doc.__v,
                child_categories: single_child
            }
            final_result.push(obj)
        })
    }

    if(Array.isArray(final_result) && final_result.length){
        res.send(final_result);
    }else{
        res.json({"message": "No categories found"});
    }

};

