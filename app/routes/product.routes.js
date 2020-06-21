module.exports = (app) => {
    const products = require('../controllers/product.controller.js');

    // Create a new product
    app.post('/products', products.create);

    // Get all products by a category
    app.get('/products', products.findAllByCategory);

    // Update a product details
    app.put('/products/:productId', products.update);

}