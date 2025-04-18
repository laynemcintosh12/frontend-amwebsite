const pool = require('../config/db');

// Insert or update a commission record in the commissions_due table
const upsertCommissionDue = async (userId, customerId, commissionAmount, buildDate) => {
  const query = `
    INSERT INTO commissions_due (user_id, customer_id, commission_amount, build_date, is_paid)
    VALUES ($1, $2, $3, $4, FALSE)
    ON CONFLICT (user_id, customer_id)
    DO UPDATE SET commission_amount = $3, build_date = $4, is_paid = FALSE, created_at = CURRENT_TIMESTAMP
    RETURNING id;
  `;
  const result = await pool.query(query, [userId, customerId, commissionAmount, buildDate]);
  return result.rows[0]?.id;
};

// Insert or update a commission record in the commission_payments table
const upsertCommissionPayment = async (userId, customerId, commissionAmount, paidOn, commissionDueId) => {
  const query = `
    INSERT INTO commission_payments (commission_due_id, user_id, customer_id, commission_amount, paid_on)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (commission_due_id)
    DO UPDATE SET commission_amount = $3, paid_on = $4, created_at = CURRENT_TIMESTAMP
    RETURNING id;
  `;
  const result = await pool.query(query, [commissionDueId, userId, customerId, commissionAmount, paidOn]);
  return result.rows[0]?.id;
};

// Fetch all commissions due
const getCommissionsDue = async () => {
  const query = `
    SELECT * FROM commissions_due;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Fetch all commissions paid
const getCommissionsPaid = async () => {
  const query = `
    SELECT * FROM commission_payments;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Update a commission record in the commissions_due table
const updateCommissionDue = async (commissionId, updates) => {
  const { commissionAmount, buildDate, isPaid } = updates;
  
  const query = `
    UPDATE commissions_due 
    SET 
      commission_amount = COALESCE($1, commission_amount),
      build_date = COALESCE($2, build_date),
      is_paid = COALESCE($3, is_paid)
    WHERE id = $4
    RETURNING *;
  `;

  const values = [
    commissionAmount,
    buildDate,
    isPaid,
    commissionId
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Update a commission record in the commission_payments table
const updateCommissionPayment = async (paymentId, updates) => {
  const { commissionAmount, paidOn } = updates;
  const query = `
    UPDATE commission_payments
    SET commission_amount = $1, paid_on = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *;
  `;
  const result = await pool.query(query, [commissionAmount, paidOn, paymentId]);
  return result.rows[0];
};

// Delete a commission record from the commissions_due table
const deleteCommissionDue = async (commissionId) => {
  const query = `
    DELETE FROM commissions_due
    WHERE id = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [commissionId]);
  return result.rows[0];
};

// Delete a commission record from the commission_payments table
const deleteCommissionPayment = async (paymentId) => {
  const query = `
    DELETE FROM commission_payments
    WHERE id = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [paymentId]);
  return result.rows[0];
};

module.exports = {
  upsertCommissionDue,
  upsertCommissionPayment,
  getCommissionsDue,
  getCommissionsPaid,
  updateCommissionDue,
  updateCommissionPayment,
  deleteCommissionDue,
  deleteCommissionPayment,
};