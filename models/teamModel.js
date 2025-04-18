const pool = require('../config/db');

// Create a new team
const createTeam = async (managerId, salesmanIds = [], supplementerIds = []) => {
  const query = `
    INSERT INTO teams (manager_id, salesman_ids, supplementer_ids, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING *;
  `;
  const values = [managerId, salesmanIds, supplementerIds];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Update a team (assign salesman/supplementers to a manager)
const updateTeam = async (teamId, salesmanIds = [], supplementerIds = []) => {
  const query = `
    UPDATE teams
    SET salesman_ids = $1, supplementer_ids = $2, updated_at = NOW()
    WHERE id = $3
    RETURNING *;
  `;
  const values = [salesmanIds, supplementerIds, teamId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get all team data - Updated query
const getAllTeams = async () => {
  const query = `
    SELECT 
      t.id AS team_id,
      t.manager_id,
      u.name AS manager_name,
      u.role AS manager_role,
      t.salesman_ids,
      t.supplementer_ids,
      t.created_at,
      t.updated_at
    FROM teams t
    JOIN users u ON t.manager_id = u.id
    ORDER BY t.created_at DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// New function to get team by customer
const getTeamsByCustomerId = async (customerId) => {
  const query = `
    SELECT 
      t.*,
      c.manager_id AS sales_manager_id,
      c.supplement_manager_id
    FROM teams t
    JOIN customers c ON 
      (c.manager_id = t.manager_id OR c.supplement_manager_id = t.manager_id)
    WHERE c.id = $1;
  `;
  const result = await pool.query(query, [customerId]);
  return result.rows;
};

// Updated function to get team by user ID
const getTeamByUserId = async (userId) => {
  const query = `
    SELECT t.*, u.role AS manager_role
    FROM teams t
    JOIN users u ON t.manager_id = u.id
    WHERE 
      t.manager_id = $1 
      OR $1 = ANY(t.salesman_ids) 
      OR $1 = ANY(t.supplementer_ids);
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

const getTeamByUserIdFromDb = async (userId) => {
  const query = `
    SELECT t.*, u.role AS manager_role
    FROM teams t
    JOIN users u ON t.manager_id = u.id
    WHERE 
      t.manager_id = $1 
      OR $1 = ANY(t.salesman_ids) 
      OR $1 = ANY(t.supplementer_ids);
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

// Delete a team
const deleteTeam = async (teamId) => {
  const query = `
    DELETE FROM teams
    WHERE id = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [teamId]);
  return result.rows[0];
};

module.exports = {
  createTeam,
  updateTeam,
  getAllTeams,
  deleteTeam,
  getTeamsByCustomerId,
  getTeamByUserId,
  getTeamByUserIdFromDb
};