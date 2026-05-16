const router = require('express').Router();
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
  toggleJobActive,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');
const { jobValidator } = require('../validators/jobValidator');

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job management endpoints
 */

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs (with filters & pagination)
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *       - in: query
 *         name: experience
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of jobs }
 */
router.get('/', getJobs);

/**
 * @swagger
 * /api/jobs/my:
 *   get:
 *     summary: Get jobs posted by current employer
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: My jobs }
 */
router.get('/my', protect, authorize('employer', 'admin'), getMyJobs);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get single job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Job details }
 *       404: { description: Job not found }
 */
router.get('/:id', getJob);

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a job post
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, company, location, description, category]
 *             properties:
 *               title: { type: string }
 *               company: { type: string }
 *               location: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               experience: { type: string }
 *               type: { type: string }
 *     responses:
 *       201: { description: Job created }
 */
router.post('/', protect, authorize('employer', 'admin'), jobValidator, createJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Job updated }
 */
router.put('/:id', protect, authorize('employer', 'admin'), updateJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Job deleted }
 */
router.delete('/:id', protect, authorize('employer', 'admin'), deleteJob);
router.patch('/:id/toggle', protect, authorize('employer', 'admin'), toggleJobActive);

module.exports = router;
