const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { updateDocument, shareDocumentByEmail, removeShare, getShares } = require('../controllers/documentController');

// All document routes require authentication
router.use(requireAuth);

router.put('/:id', updateDocument);
router.post('/:id/share', shareDocumentByEmail);
router.delete('/:id/share/:userId', removeShare);
router.get('/:id/shares', getShares);

module.exports = router;
