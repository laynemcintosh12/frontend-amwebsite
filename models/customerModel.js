const pool = require('../config/db');

// Add or update a customer in the database
const upsertCustomer = async (customer) => {
  const query = `
    INSERT INTO customers (
      customer_name, address, phone, salesman_id, supplementer_id, 
      manager_id, supplement_manager_id, status, initial_scope_price, 
      total_job_price, lead_source, referrer_id, build_date, last_updated_at, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
    ON CONFLICT (customer_name) DO UPDATE SET
      address = EXCLUDED.address,
      phone = EXCLUDED.phone,
      salesman_id = EXCLUDED.salesman_id,
      supplementer_id = EXCLUDED.supplementer_id,
      manager_id = EXCLUDED.manager_id,
      supplement_manager_id = EXCLUDED.supplement_manager_id,
      status = EXCLUDED.status,
      initial_scope_price = EXCLUDED.initial_scope_price,
      total_job_price = EXCLUDED.total_job_price,
      lead_source = EXCLUDED.lead_source,
      referrer_id = EXCLUDED.referrer_id,
      build_date = EXCLUDED.build_date,
      last_updated_at = NOW()
    RETURNING *;
  `;
  const values = [
    customer.name,
    customer.address,
    customer.phone,
    customer.salesman_id,
    customer.supplementer_id,
    customer.manager_id,
    customer.supplement_manager_id,
    customer.status,
    customer.initial_scope_price,
    customer.total_job_price,
    customer.lead_source,
    customer.referrer_id,
    customer.build_date,
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get all customers
const getAllCustomers = async () => {
  const query = `
    SELECT * FROM customers
    ORDER BY created_at DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Search customers by query and filter by user roles
const searchCustomersByQuery = async (query, userId) => {
  const searchQuery = `
    SELECT * FROM customers
    WHERE (
      LOWER(customer_name) ILIKE LOWER($1) 
      OR LOWER(address) ILIKE LOWER($1) 
      OR phone ILIKE $1
    )
    AND (
      salesman_id = $2 
      OR supplementer_id = $2 
      OR manager_id = $2 
      OR supplement_manager_id = $2
      OR referrer_id = $2
    )
    ORDER BY last_updated_at DESC
    LIMIT 5;
  `;
  const values = [`%${query}%`, userId];
  const result = await pool.query(searchQuery, values);
  return result.rows;
};

// Get customer by ID
const getCustomerById = async (id) => {
  const query = `
    SELECT * FROM customers
    WHERE id = $1;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Delete a customer by ID
const deleteCustomer = async (id) => {
  const query = `
    DELETE FROM customers
    WHERE id = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  upsertCustomer,
  getAllCustomers,
  searchCustomersByQuery,
  getCustomerById,
  deleteCustomer,
};