const pool = require('../config/db');

class TeamService {
  static async getManagersByCustomerId(customerId) {
    const query = `
      SELECT 
        c.id AS customer_id,
        sm.id AS sales_manager_id,
        sm.name AS sales_manager_name,
        spm.id AS supplement_manager_id,
        spm.name AS supplement_manager_name
      FROM customers c
      LEFT JOIN users sm ON c.manager_id = sm.id
      LEFT JOIN users spm ON c.supplement_manager_id = spm.id
      WHERE c.id = $1;
    `;
    const result = await pool.query(query, [customerId]);
    return result.rows[0];
  }

  static async getSharedCustomers(managerId) {
    const query = `
      SELECT * FROM customers
      WHERE 
        (manager_id = $1 AND supplement_manager_id IS NOT NULL) OR
        (supplement_manager_id = $1 AND manager_id IS NOT NULL);
    `;
    const result = await pool.query(query, [managerId]);
    return result.rows;
  }
}

module.exports = TeamService;