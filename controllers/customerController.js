const { 
  upsertCustomer, 
  getAllCustomers, 
  searchCustomersByQuery, 
  getCustomerById, 
  deleteCustomer 
} = require('../models/customerModel');
const { fetchJobNimbusData } = require('../services/jobNimbusService');
const { 
  getUserByName, 
} = require('../models/userModel'); // Import getUserByName
const { 
  upsertCommissionDue
} = require('./commissionController'); // Use commissionController functions
const logger = require('../utils/logger');
const { sendErrorNotification } = require('../utils/email');

// Sync customers from JobNimbus API
const syncCustomers = async (req, res, next = () => {}) => {
  try {
    logger.info('Starting customer sync process...');
    
    const jobNimbusData = await fetchJobNimbusData();
    if (!Array.isArray(jobNimbusData.results)) {
      throw new Error('JobNimbus data is not in the expected format.');
    }

    const processedCustomers = [];
    const errors = [];

    for (const job of jobNimbusData.results) {
      try {
        // Find associated users
        const salesman = job['sales_rep_name'] ? await getUserByName(job['sales_rep_name']) : null;
        const supplementer = job['Supplementer Assigned'] ? await getUserByName(job['Supplementer Assigned']) : null;
        
        let referrer = null;
        if (job.source_name === 'Affiliate' && job['Affiliate Name']) {
          referrer = await getUserByName(job['Affiliate Name']);
        }

        const buildDate = job['Build Date'] ? new Date(job['Build Date'] * 1000) : null;

        // Create/update customer
        const customer = {
          name: job.name,
          address: job.address_line1,
          phone: job.parent_mobile_phone,
          salesman_id: salesman?.id || null,
          supplementer_id: supplementer?.id || null,
          manager_id: null,
          supplement_manager_id: null,
          status: job.status_name,
          initial_scope_price: job['Initial Scope Price'],
          total_job_price: job['Final Job Price'],
          lead_source: job.source_name,
          referrer_id: referrer?.id || null,
          build_date: buildDate,
        };

        const upsertedCustomer = await upsertCustomer(customer);
        processedCustomers.push(upsertedCustomer);

        // Process commissions for associated users
        const associatedUsers = [
          { id: customer.salesman_id, role: 'Salesman' },
          { id: customer.supplementer_id, role: 'Supplementer' },
          { id: customer.manager_id, role: 'Sales Manager' },
          { id: customer.referrer_id, role: 'Affiliate Marketer' }
        ].filter(user => user.id !== null);

        for (const { id: userId } of associatedUsers) {
          try {
            // Use commission controller to handle all commission logic
            await upsertCommissionDue({
              body: {
                userId,
                customerId: upsertedCustomer.id,
                buildDate
              }
            }, null, next);
          } catch (commissionError) {
            logger.error(`Error processing commission for user ${userId}: ${commissionError.message}`);
            errors.push({
              type: 'commission',
              userId,
              customerId: upsertedCustomer.id,
              error: commissionError.message
            });
          }
        }
      } catch (jobError) {
        logger.error(`Error processing job: ${jobError.message}`);
        errors.push({
          type: 'job',
          jobData: job,
          error: jobError.message
        });
      }
    }

    logger.info(`Sync completed. Processed ${processedCustomers.length} customers. ${errors.length} errors.`);
    return res.status(errors.length > 0 ? 207 : 200).json({
      message: 'Sync completed',
      customersProcessed: processedCustomers.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    logger.error('Sync failed:', error);
    next(error);
  }
};

// Get all customers
const getCustomers = async (req, res, next) => {
  try {
    const customers = await getAllCustomers();
    res.status(200).json(customers);
  } catch (error) {
    next(error);
  }
};

// Search customers by query
const searchCustomers = async (req, res, next) => {
  try {
    const { q: query, userId } = req.query;

    if (!query || !userId) {
      return res.status(400).json({ 
        error: 'Search query and user ID are required' 
      });
    }

    if (query.length < 2) {
      return res.json([]);  // Return empty results for very short queries
    }

    const customers = await searchCustomersByQuery(query, userId);
    res.status(200).json(customers);
  } catch (error) {
    next(error);
  }
};

// Get customer by ID
const getCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const customer = await getCustomerById(customerId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.status(200).json(customer);
  } catch (error) {
    next(error);
  }
};

// Delete a customer
const deleteCustomerController = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const deletedCustomer = await deleteCustomer(customerId);

    if (!deletedCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.status(200).json({ message: 'Customer deleted successfully', deletedCustomer });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  syncCustomers, 
  getCustomers, 
  searchCustomers, 
  getCustomer, 
  deleteCustomerController 
};