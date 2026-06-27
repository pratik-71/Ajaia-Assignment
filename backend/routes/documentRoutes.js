const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { updateDocument } = require('../controllers/documentController');

// All document routes require authentication
router.use(requireAuth);

router.put('/:id', updateDocument);

module.exports = router;
