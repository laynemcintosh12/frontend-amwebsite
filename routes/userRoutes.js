const express = require('express');
const {
  registerUser,
  loginUser,
  getUserDetails, // Updated to use the new function
  updateUserDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  deleteUserById,
  getAllUsers,
} = require('../controllers/userController');
const { protectRoute } = require('../middleware/authMiddleware');

const router = express.Router();

// =========================
// Public Routes
// =========================
router.post('/register', registerUser); // Register a new user
router.post('/login', loginUser); // Login a user
router.post('/forgot-password', forgotPassword); // Generate a password reset token
router.post('/reset-password', resetPassword); // Reset password using a reset token

// =========================
// Protected Routes (Require Authentication)
// =========================
router.get('/', getAllUsers); // Get all users
router.get('/details', getUserDetails); // Get user details by email, id, or name
router.put('/:id', updateUserDetails); // Update user details
router.put('/:id/password', updatePassword); // Update user password
router.delete('/:id', deleteUserById); // Delete a user

module.exports = router;