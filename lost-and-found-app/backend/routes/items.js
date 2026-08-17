const express = require('express');
const router = express.Router();
const {
  getItems,
  getMyItems,
  getItemById,
  createItem,
  updateItem,
  updateStatus,
  deleteItem,
  getCategories,
  getAdminStats,
} = require('../controllers/itemController');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');

router.get('/items/categories', getCategories);
router.get('/items/my', requireAuth, getMyItems);
router.get('/items/admin/stats', requireAdmin, getAdminStats);
router.get('/items', optionalAuth, getItems);
router.get('/items/:id', optionalAuth, getItemById);
router.post('/items', requireAuth, createItem);
router.put('/items/:id', requireAuth, updateItem);
router.patch('/items/:id/status', requireAuth, updateStatus);
router.delete('/items/:id', requireAuth, deleteItem);

module.exports = router;
