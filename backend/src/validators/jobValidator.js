const { body } = require('express-validator');

const jobValidator = [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('company').trim().notEmpty().withMessage('Company name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(['IT', 'Marketing', 'Design', 'Finance', 'Education', 'Healthcare', 'Engineering', 'Sales', 'Other'])
    .withMessage('Invalid category'),
];

module.exports = { jobValidator };
