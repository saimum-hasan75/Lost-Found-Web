const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleAuth,
  getMe,
  updateMe,
  getUsers,
  deleteUser,
} = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.post('/google', googleAuth);
router.post('/auth/google', googleAuth);

router.post('/register', register);
router.post('/auth/register', register);

router.post('/login', login);
router.post('/auth/login', login);

router.get('/me', requireAuth, getMe);
router.get('/auth/me', requireAuth, getMe);

router.put('/me', requireAuth, updateMe);
router.put('/auth/me', requireAuth, updateMe);

// Admin user management routes
router.get('/users', requireAdmin, getUsers);
router.get('/auth/users', requireAdmin, getUsers);

router.delete('/users/:id', requireAdmin, deleteUser);
router.delete('/auth/users/:id', requireAdmin, deleteUser);

module.exports = router;
