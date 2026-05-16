const router = require('express').Router();
const {
  applyJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Job application endpoints
 */

/**
 * @swagger
 * /api/applications/my:
 *   get:
 *     summary: Get my applications
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of user applications }
 */
router.get('/my', protect, getMyApplications);

/**
 * @swagger
 * /api/applications/job/{jobId}:
 *   get:
 *     summary: Get all applicants for a job (employer/admin)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Job applicants }
 */
router.get('/job/:jobId', protect, authorize('employer', 'admin'), getJobApplications);

/**
 * @swagger
 * /api/applications/{jobId}:
 *   post:
 *     summary: Apply for a job
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume: { type: string, format: binary }
 *               coverLetter: { type: string }
 *     responses:
 *       201: { description: Application submitted }
 */
router.post('/:jobId', protect, authorize('user'), upload.single('resume'), applyJob);

/**
 * @swagger
 * /api/applications/{id}/status:
 *   patch:
 *     summary: Update application status
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [pending, reviewed, accepted, rejected] }
 *     responses:
 *       200: { description: Status updated }
 */
router.patch('/:id/status', protect, authorize('employer', 'admin'), updateApplicationStatus);
router.delete('/:id', protect, authorize('user'), withdrawApplication);

module.exports = router;
