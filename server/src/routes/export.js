// routes/export.js
import { Router } from 'express';
const router = Router();
import { exportPolicy } from '../controllers/exportController.js'; // Adjust import path if needed

router.post('/policies/:id/export', exportPolicy);     // POST body { format } OR query ?format=
router.get('/policies/:id/export', exportPolicy);      // also allow GET with ?format=

export default router;