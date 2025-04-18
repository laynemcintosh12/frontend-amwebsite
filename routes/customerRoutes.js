const express = require('express');
const { 
  syncCustomers, 
  getCustomers, 
  searchCustomers, 
  getCustomer, 
  deleteCustomerController 
} = require('../controllers/customerController');

const router = express.Router();

// Routes for customers
router.get('/', getCustomers); // Get all customers
router.post('/sync', async (req, res, next) => {
  console.log('Sync endpoint hit');
  try {
    await syncCustomers(req, res, next);
  } catch (error) {
    console.error('Sync route error:', error);
    next(error);
  }
}); // Sync customers from JobNimbus API
router.get('/search', searchCustomers); // Search customers by query
router.get('/:customerId', getCustomer); // Get a single customer by ID
router.delete('/:customerId', deleteCustomerController); // Delete a customer by ID

module.exports = router;