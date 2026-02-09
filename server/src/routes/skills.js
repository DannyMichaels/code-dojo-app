import { Router } from 'express';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { searchCatalogSchema } from '../schemas/skills.js';
import { listCatalog, searchCatalog, getCatalogEntry } from '../controllers/skills.js';

const router = Router();

router.get('/catalog', listCatalog);
router.post('/catalog/search', auth, validate(searchCatalogSchema), searchCatalog);
router.get('/catalog/:slug', getCatalogEntry);

export default router;
