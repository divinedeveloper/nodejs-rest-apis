module.exports = (app) => {
    const categories = require('../controllers/category.controller.js');

    // Create a new category
    app.post('/categories', categories.create);

    // Retrieve all categories
    app.get('/categories', categories.findAll);

}