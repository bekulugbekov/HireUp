const router = require('express').Router();
const {
  updateProfile,
  changePassword,
  saveJob,
  getSavedJobs,
  getAllUsers,
  deleteUser,
  getStats,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.patch('/change-password', protect, changePassword);
router.post('/saved/:jobId', protect, saveJob);
router.get('/saved', protect, getSavedJobs);

// Admin routes
router.get('/', protect, authorize('admin'), getAllUsers);
router.delete('/:id', protect, authorize('admin'), deleteUser);
router.get('/stats', protect, authorize('admin'), getStats);

module.exports = router;
