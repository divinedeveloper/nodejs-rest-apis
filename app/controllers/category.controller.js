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

        {
            $addFields: { child_categories: [] }
          },
        
          { "$lookup": {
            "from": "categories",
            "localField": "category",
            "foreignField": "parent",
            "as": "child_categories"
          }},

          
    // reshape the data you'll need further on from each mached doc
    {
        $project: {
            _id: false,
            data: {
                id: '$_id',
                name: '$name',
                category: '$category',
                child_categories: '$child_categories'
                // I guess you'll also want the `slug` and `image` here.
                // but that's homework :)
            },
            parent: '$parent'
        }
    },
    // now put a common _id so you can group them, and also put stuff into arrays
    {
        $project: {
            id: {$literal: 'id'},
            mainCategory: {
                // if our parent is null, put our data.
                // otherwise put null here.
                $cond: [{$eq: ["/", '$parent']}, {_id: '$data.id', name: '$data.name', child_categories: '$data.child_categories' }, null]
            },
            subcat: {
                // here is the other way around.
                $cond: [{$ne: ["/", '$parent']}, {_id: '$data.id', name: '$data.name', child_categories: '$data.child_categories'}, null]
    
            }
        }
        // that stage produces for each doc either a mainCat or subcat
        // (and the other prop equals to null)
    },

    /*
    // My group for 
    {
        $group: {
            _id: '$parent',
            // a bit hacky, but mongo will yield to it
            mainCategory: {$addToSet: '$mainCategory'},
            subCategories: {
                // this will, unfortunately, also add the `null` we have
                // assigned to main category up there
                $addToSet: '$subcat'
            }
        }
    },*/
    
    // finally, group the things so you can have them together
    {
        $group: {
            _id: '$parent',
            // a bit hacky, but mongo will yield to it
            mainCategory: {$addToSet: '$mainCategory'},
            subCategories: {
                // this will, unfortunately, also add the `null` we have
                // assigned to main category up there
                $addToSet: '$subcat'
            }
        }
    },
    // so we get rid of the unwanted _id = 'id' and the null from subcats.
    {
        $project: {
            _id: false,
            mainCategory: '$mainCategory',
            subCategories: {
                $setDifference: ['$subCategories', [null]]
            }
        }
    }]).exec();
    

    if(Array.isArray(categories) && categories.length){
        res.send(categories);
    }else{
        res.json({"message": "No categories found"});
    }

};

