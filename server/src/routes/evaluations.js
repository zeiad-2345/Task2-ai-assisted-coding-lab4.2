import { Router } from 'express';
import {
  getAllEvaluations,
  getEvaluation,
  createEvaluation,
  getEvaluationSummary
} from '../controllers/evaluationController.js';

const router = Router();

router.get('/', getAllEvaluations);
// Must come before /:id, otherwise "summary" is treated as an id.
router.get('/summary', getEvaluationSummary);
router.get('/:id', getEvaluation);
router.post('/', createEvaluation);

export default router;
