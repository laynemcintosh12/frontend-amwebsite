const pool = require('../config/db');
const { 
  createUser, 
  authenticateUser, 
  getUserByEmail, 
  updateUser, 
  deleteUser,
  getUserById,    // Add this
  getUserByName   // Add this
} = require('../models/userModel');
const { hashPassword, verifyPassword, generateToken } = require('../services/authService');
const { AppError } = require('../utils/error');
const { sendPasswordResetEmail } = require('../utils/email');
const crypto = require('crypto');


// Register a new user
const registerUser = async (req, res, next) => {
  try {
    console.log('Registering user:', req.body);
    const { name, email, password, role, permissions, phone, hireDate } = req.body;

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user
    const user = await createUser(name, email, hashedPassword, role, permissions, phone, hireDate);

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    next(error);
  }
};

// Login a user
const loginUser = async (req, res, next) => {
  try {
    const { email, password, token } = req.body;

    let user;

    if (token) {
      // Authenticate using the reset token
      const result = await pool.query(
        'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
        [token]
      );
      user = result.rows[0];

      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      // Clear the reset token after successful login
      await pool.query(
        'UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1',
        [user.id]
      );
    } else {
      // Authenticate using email and password
      user = await authenticateUser(email, password);
    }

    // Generate a JWT token for the user
    const jwtToken = generateToken(user.id);

    res.status(200).json({
      message: 'Login successful',
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        yearly_goal: user.yearly_goal,
      },
    });
  } catch (error) {
    console.error('Error authenticating user:', error);
    next(error);
  }
};

// Get user details by email, id, or name
const getUserDetails = async (req, res, next) => {
  try {
    console.log('Fetching user details...', req.query);
    const { email, id, name } = req.query; // Extract email, id, or name from query parameters

    if (!email && !id && !name) {
      return res.status(400).json({ error: 'You must provide either email, id, or name to fetch user details' });
    }

    let user;

    if (email) {
      user = await getUserByEmail(email); // Fetch user by email
    } else if (id) {
      user = await getUserById(id); // Fetch user by ID
    } else if (name) {
      user = await getUserByName(name); // Fetch user by name
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Update user details
const updateUserDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedUser = await updateUser(id, updates);
    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({ message: 'User updated successfully', updatedUser });
  } catch (error) {
    next(error);
  }
};

// Update user password
const updatePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Get user from database
    const user = await getUserById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the password in database
    await updateUser(id, { password: hashedPassword });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Forgot password (generate reset token)
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Get user from database
    const user = await getUserByEmail(email);
    if (!user) {
      // Return same message even if user doesn't exist (security)
      return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
    }

    // Generate reset token and expiration
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    // Store reset token in database
    await updateUser(user.id, {
      reset_password_token: resetToken,
      reset_password_expires: resetPasswordExpires
    });

    // Send email with reset token
    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// Reset password
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    console.log('Reset token:', resetToken);
    console.log('New password:', newPassword);

    // Find the user by reset token
    const result = await pool.query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [resetToken]
    );
    const user = result.rows[0];

    console.log('User found for reset token:', user);
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password and clear the reset token
    await pool.query(
      'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    next(error);
  }
};

// Delete a user
const deleteUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedUser = await deleteUser(id);
    if (!deletedUser) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({ message: 'User deleted successfully', deletedUser });
  } catch (error) {
    next(error);
  }
};

// Get user details by ID
const getUserDetailsById = async (userId) => {
  try {
    const query = `
      SELECT id, name, email, role, permissions, phone, hire_date, created_at
      FROM users 
      WHERE id = $1
    `;
    const result = await pool.query(query, [userId]);
    if (!result.rows[0]) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw new Error(`Failed to fetch user by ID: ${error.message}`);
  }
};

// Get all users
const getAllUsersController = async (req, res, next) => {
  try {
    const users = await require('../models/userModel').getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserDetails,
  updateUserDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  deleteUserById,
  getUserDetailsById,
  getAllUsers: getAllUsersController, // Export with the original name for backwards compatibility
};