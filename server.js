// path/to/server.js
const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 5005;

// Middleware to parse JSON
app.use(express.json());

app.get('/api/categories-themes', (req, res) => {
  // Read the db.json file
  fs.readFile('db.json', 'utf8', (err, data) => {
      if (err) {
          return res.status(500).send('Error reading database');
      }

      const products = JSON.parse(data).products;

      // Extract unique categories
      const categories = [...new Set(products.map(product => product.category))];

      // Extract unique themes
      const themes = [...new Set(products.map(product => product.theme))];

      res.json({
          categories,
          themes
      });
  });
});

app.get('/api/products', (req, res) => {
  // Read the db.json file
  fs.readFile('db.json', 'utf8', (err, data) => {
      if (err) {
          return res.status(500).send('Error reading database');
      }

      const products = JSON.parse(data).products;

      // Filtering
      let filteredProducts = products;
      if (req.query.category) {
          filteredProducts = filteredProducts.filter(product => product.category === req.query.category);
      }
      if (req.query.minPrice) {
          filteredProducts = filteredProducts.filter(product => product.price >= req.query.minPrice);
      }
      if (req.query.maxPrice) {
          filteredProducts = filteredProducts.filter(product => product.price <= req.query.maxPrice);
      }

      // Unified Search for Title and Author Name
      if (req.query.search) {
          const searchQuery = req.query.search.toLowerCase();
          filteredProducts = filteredProducts.filter(product => {
              const titleMatch = product.title.toLowerCase().includes(searchQuery);
              const authorMatch = `${product.author.firstName} ${product.author.lastName}`.toLowerCase().includes(searchQuery);
              return titleMatch || authorMatch;
          });
      }

      // Sorting
      if (req.query.sortBy) {
          const sortCriteria = req.query.sortBy.split(','); // Allow multiple sort criteria
          const sortDirections = req.query.sortDirection ? req.query.sortDirection.split(',') : []; // Allow multiple sort directions

          filteredProducts.sort((a, b) => {
              for (let i = 0; i < sortCriteria.length; i++) {
                  const criterion = sortCriteria[i];
                  const direction = sortDirections[i] || 'asc'; // Default to ascending if no direction is provided

                  let comparison = 0;

                  if (criterion === 'price') {
                      comparison = a.price - b.price; // Ascending order by price
                  } else if (criterion === 'createdAt') {
                      comparison = new Date(a.createdAt) - new Date(b.createdAt); // Ascending order by createdAt
                  } else if (criterion === 'title') {
                      comparison = a.title.localeCompare(b.title); // Ascending order by title
                  }

                  // Adjust comparison based on direction
                  if (direction === 'desc') {
                      comparison = -comparison; // Reverse the comparison for descending order
                  }

                  if (comparison !== 0) {
                      return comparison; // Return the result of the comparison
                  }
              }
              return 0; // Default case
          });
      }

      // Last Item Logic
      const lastItemId = req.query.lastItemId;
      if (lastItemId) {
          const lastItemIndex = filteredProducts.findIndex(product => product.id === lastItemId);
          if (lastItemIndex !== -1) {
              filteredProducts = filteredProducts.slice(lastItemIndex + 1);
          }
      }

      // Limit the number of results
      const limit = parseInt(req.query.limit) || 10;
      const paginatedProducts = filteredProducts.slice(0, limit);

      res.json({
          total: filteredProducts.length,
          products: paginatedProducts
      });
  });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});