const express = require('express');
const { 
  createNewTeam, 
  modifyTeam, 
  getTeams, 
  removeTeam, 
  getTeamByUserId,
  getTeamCustomers 
} = require('../controllers/teamController');
const { protectRoute } = require('../middleware/authMiddleware'); // Middleware for authentication

const router = express.Router();

// Routes for teams
router.post('/', createNewTeam); // Create a new team
router.put('/', modifyTeam); // Update a team
router.get('/', getTeams); // Get all teams
router.delete('/:teamId', removeTeam); // Delete a team
router.get('/user/:userId', getTeamByUserId);
router.get('/:teamId/customers', getTeamCustomers);

module.exports = router;