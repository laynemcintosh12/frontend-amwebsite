const { calculateCommission } = require('../services/commissionService');
const {
  upsertCommissionDue,
  upsertCommissionPayment,
  getCommissionsDue,
  getCommissionsPaid,
  updateCommissionDue,
  updateCommissionPayment,
  deleteCommissionDue,
  deleteCommissionPayment,
} = require('../models/commissionModel');
const { getCustomerById } = require('../models/customerModel'); // Import directly from customerModel.js
const { getUserDetailsById } = require('../controllers/userController');
const { getTeamByUserId } = require('../controllers/teamController');

// Helper function to handle errors for both middleware and direct invocation
const handleError = (error, res, next) => {
  if (res && typeof res.status === 'function') {
    res.status(500).json({ error: error.message });
  } else if (typeof next === 'function') {
    next(error);
  } else {
    throw error;
  }
};

// Update the upsertCommissionDue function to handle both direct calls and API requests
const upsertCommissionDueController = async (req, res, next) => {
  try {
    // Handle both direct calls and API requests
    const userId = req.userId || req.body?.userId;
    const customerId = req.customerId || req.body?.customerId;
    const buildDate = req.buildDate || req.body?.buildDate;

    if (!userId || !customerId) {
      throw new Error('userId and customerId are required');
    }

    const user = await getUserDetailsById(userId);
    const customer = await getCustomerById(customerId);
    const team = await getTeamByUserId(userId);

    // Calculate commission
    const commissionAmount = await calculateCommission(user, customer, team);

    // Save to database
    const commissionId = await upsertCommissionDue(userId, customerId, commissionAmount, buildDate);

    // Check if commission is marked as paid
    const commissions = await getCommissionsDue();
    const commission = commissions.find(c => c.id === commissionId);

    if (commission && commission.is_paid) {
      // If paid, create/update payment record
      await upsertCommissionPaymentController({
        body: {
          userId,
          customerId,
          paidOn: buildDate || new Date(),
          commissionDueId: commissionId
        }
      }, null, next);
    }

    if (res) {
      res.status(200).json({ commissionId });
    }
    return commissionId;
  } catch (error) {
    handleError(error, res, next);
  }
};

// Add or update a commission in the commission_payments table
const upsertCommissionPaymentController = async (req, res, next) => {
  try {
    const { userId, customerId, paidOn, commissionDueId } = req.body;

    // Fetch required data
    const user = await getUserDetailsById(userId);
    const customer = await getCustomerById(customerId);
    const team = await getTeamByUserId(userId);

    // Calculate commission
    const commissionAmount = await calculateCommission(user, customer, team);

    // Save to commission_payments table
    const paymentId = await upsertCommissionPayment(userId, customerId, commissionAmount, paidOn, commissionDueId);

    if (res) {
      res.status(200).json({ message: 'Commission payment upserted successfully', paymentId });
    } else {
      return paymentId;
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

// Fetch all commissions due
const fetchCommissionsDue = async (req, res, next = () => {}) => {
  try {
    const commissions = await getCommissionsDue();
    if (res) {
      // If res is provided, send the response (middleware usage)
      res.status(200).json(commissions);
    } else {
      // If res is not provided, return the data (direct invocation)
      return commissions;
    }
  } catch (error) {
    if (typeof next === 'function') {
      next(error); // Middleware usage
    } else {
      // Direct invocation: throw the error to be handled by the caller
      throw error;
    }
  }
};

// Fetch all commissions paid
const fetchCommissionsPaid = async (req, res, next) => {
  try {
    const commissions = await getCommissionsPaid();
    res.status(200).json(commissions);
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update a commission in the commissions_due table
const updateCommissionDueController = async (req, res, next) => {
  try {
    const { commissionId } = req.params;
    const { userId, customerId, buildDate } = req.body;

    // Fetch required data
    const user = await getUserDetailsById(userId);
    const customer = await getCustomerById(customerId);
    const team = await getTeamByUserId(userId);

    // Calculate commission
    const commissionAmount = await calculateCommission(user, customer, team);

    // Update the commission in the commissions_due table
    const updatedCommission = await updateCommissionDue(commissionId, {
      commissionAmount,
      buildDate,
      isPaid: false,
    });

    if (res) {
      res.status(200).json({ message: 'Commission due updated successfully', updatedCommission });
    } else {
      return updatedCommission;
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update a commission in the commission_payments table
const updateCommissionPaymentController = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { userId, customerId, paidOn } = req.body;

    // Fetch required data
    const user = await getUserDetailsById(userId);
    const customer = await getCustomerById(customerId);
    const team = await getTeamByUserId(userId);

    // Calculate commission
    const commissionAmount = await calculateCommission(user, customer, team);

    // Update the commission in the commission_payments table
    const updatedPayment = await updateCommissionPayment(paymentId, {
      commissionAmount,
      paidOn,
    });

    if (res) {
      res.status(200).json({ message: 'Commission payment updated successfully', updatedPayment });
    } else {
      return updatedPayment;
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete a commission from the commissions_due table
const deleteCommissionDueController = async (req, res, next) => {
  try {
    const { commissionId } = req.params;
    const deletedCommission = await deleteCommissionDue(commissionId);

    if (res) {
      res.status(200).json({ message: 'Commission due deleted successfully', deletedCommission });
    } else {
      return deletedCommission;
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete a commission from the commission_payments table
const deleteCommissionPaymentController = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const deletedPayment = await deleteCommissionPayment(paymentId);

    if (res) {
      res.status(200).json({ message: 'Commission payment deleted successfully', deletedPayment });
    } else {
      return deletedPayment;
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

// Calculate commission for a customer (used for search or other purposes)
const calculateCustomerCommissionForSearch = async (req, res, next) => {
  try {
    const { userId, customerId } = req.body;

    // Fetch user, customer, and team details
    const user = await getUserDetailsById(userId);
    const customer = await getCustomerById(customerId);
    const team = await getTeamByUserId(userId);

    // Calculate commission
    const commission = await calculateCommission(user, customer, team);

    if (res) {
      res.status(200).json({ commission });
    } else {
      return commission;
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update the markCommissionAsPaid function to handle both direct calls and API requests
const markCommissionAsPaid = async (commissionId, paidOn, res = null, next = null) => {
  try {
    if (!commissionId) {
      throw new Error('Commission ID is required');
    }

    logger.debug('Marking commission as paid:', { commissionId, paidOn });

    // Get commission details
    const commissions = await getCommissionsDue();
    const commission = commissions.find(c => c.id === commissionId);

    if (!commission) {
      throw new Error('Commission not found');
    }

    // Update commission status
    await updateCommissionDue(commissionId, {
      isPaid: true
    });

    // Create payment record
    await upsertCommissionPayment(
      commission.user_id,
      commission.customer_id,
      commission.commission_amount,
      paidOn || new Date(),
      commissionId
    );

    if (res) {
      res.status(200).json({ message: 'Commission marked as paid successfully' });
    }
  } catch (error) {
    if (next) {
      next(error);
    } else {
      throw error;
    }
  }
};

module.exports = {
  upsertCommissionDue: upsertCommissionDueController,
  upsertCommissionPayment: upsertCommissionPaymentController,
  fetchCommissionsDue,
  fetchCommissionsPaid,
  updateCommissionDue: updateCommissionDueController,
  updateCommissionPayment: updateCommissionPaymentController,
  deleteCommissionDue: deleteCommissionDueController,
  deleteCommissionPayment: deleteCommissionPaymentController,
  calculateCustomerCommissionForSearch,
  markCommissionAsPaid,
};