const express = require('express');
const {
  upsertCommissionDue,
  upsertCommissionPayment,
  fetchCommissionsDue,
  fetchCommissionsPaid,
  updateCommissionDue,
  updateCommissionPayment,
  deleteCommissionDue,
  deleteCommissionPayment,
  calculateCustomerCommissionForSearch,
  markCommissionAsPaid,
} = require('../controllers/commissionController');

const router = express.Router();

// Define routes
// Commissions Due
router.post('/due', upsertCommissionDue); // Add or update a commission in the commissions_due table
router.get('/due', fetchCommissionsDue); // Fetch all commissions due
router.put('/due/:commissionId', updateCommissionDue); // Update a commission in the commissions_due table
router.delete('/due/:commissionId', deleteCommissionDue); // Delete a commission from the commissions_due table

// Commissions Paid
router.post('/paid', upsertCommissionPayment); // Add or update a commission in the commission_payments table
router.get('/paid', fetchCommissionsPaid); // Fetch all commissions paid
router.put('/paid/:paymentId', updateCommissionPayment); // Update a commission in the commission_payments table
router.delete('/paid/:paymentId', deleteCommissionPayment); // Delete a commission from the commission_payments table

// Calculate Commission
router.post('/calculate/search', calculateCustomerCommissionForSearch); // Calculate commission for a customer (used for search)
router.post('/markAsPaid', markCommissionAsPaid); // Mark a commission as paid


module.exports = router;