const { 
  createTeam, 
  updateTeam, 
  getAllTeams, 
  deleteTeam, 
  getTeamById,
  getTeamByUserIdFromDb 
} = require('../models/teamModel');
const pool = require('../config/db');

// Create a new team
const createNewTeam = async (req, res, next) => {
  try {
    const { managerId, salesmanIds = [], supplementerIds = [] } = req.body;

    // Validate input
    if (!managerId) {
      return res.status(400).json({ error: 'Manager ID is required' });
    }

    const team = await createTeam(managerId, salesmanIds, supplementerIds);
    res.status(201).json({ message: 'Team created successfully', team });
  } catch (error) {
    next(error);
  }
};

// Update a team
const modifyTeam = async (req, res, next) => {
  try {
    const { teamId, salesmanIds = [], supplementerIds = [] } = req.body;

    // Validate input
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const updatedTeam = await updateTeam(teamId, salesmanIds, supplementerIds);
    res.status(200).json({ message: 'Team updated successfully', updatedTeam });
  } catch (error) {
    next(error);
  }
};

// Get all teams
const getTeams = async (req, res, next) => {
  try {
    const teams = await getAllTeams();
    res.status(200).json(teams);
  } catch (error) {
    next(error);
  }
};

// Delete a team
const removeTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    // Validate input
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const deletedTeam = await deleteTeam(teamId);

    if (!deletedTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.status(200).json({ message: 'Team deleted successfully', deletedTeam });
  } catch (error) {
    next(error);
  }
};

// Updated getTeamByUserId function
const getTeamByUserId = async (req, res, next) => {
  try {
    const userId = parseInt(req.params?.userId || req);
    
    // If no userId provided, return early
    if (!userId) {
      return next(new Error('User ID is required'));
    }

    const team = await getTeamByUserIdFromDb(userId); // Use new function from model
    
    // If this is a direct API call (not internal)
    if (res) {
      if (!team) {
        return res.status(404).json({ error: 'Team not found for this user' });
      }

      // Get all customers associated with this team
      const customersQuery = `
        SELECT * FROM customers 
        WHERE 
          (manager_id = $1 AND supplement_manager_id IS NOT NULL) OR
          (supplement_manager_id = $1 AND manager_id IS NOT NULL)
      `;
      const customers = await pool.query(customersQuery, [team.manager_id]);
      
      team.shared_customers = customers.rows;
      
      return res.status(200).json(team);
    }

    // If this is an internal call
    return team;

  } catch (error) {
    if (next) {
      return next(error);
    }
    throw error;
  }
};

// New function to get customers by team
const getTeamCustomers = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const team = await getTeamById(teamId);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const customers = await pool.query(`
      SELECT * FROM customers 
      WHERE manager_id = $1 OR supplement_manager_id = $1
    `, [team.manager_id]);

    res.status(200).json(customers.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  createNewTeam, 
  modifyTeam, 
  getTeams, 
  removeTeam,
  getTeamByUserId,
  getTeamCustomers
};