import { Router } from 'express';
import { getOptions } from '../controllers/meta.controller.js';

const router = Router();

router.get('/options', getOptions);

export default router;
