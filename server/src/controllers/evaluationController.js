import Joi from 'joi';
import mongoose from 'mongoose';
import { Evaluation } from '../models/Evaluation.js';

const objectId = Joi.string().custom((value, helpers) => (
  mongoose.isValidObjectId(value) ? value : helpers.error('any.invalid')
), 'ObjectId');

const createSchema = Joi.object({
  seminarCode: Joi.string().trim().required(),
  score: Joi.number().min(1).max(5).required(),
  comment: Joi.string().allow(''),
  evaluatedBy: objectId
});

// GET /api/evaluations
export async function getAllEvaluations(req, res, next) {
  try {
    const evaluations = await Evaluation.find().sort({ createdAt: -1 }).lean();
    res.json({ evaluations });
  } catch (err) { next(err); }
}

// GET /api/evaluations/:id
export async function getEvaluation(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid evaluation id' });
    }
    const evaluation = await Evaluation.findById(req.params.id).lean();
    if (!evaluation) return res.status(404).json({ message: 'Evaluation not found' });
    res.json({ evaluation });
  } catch (err) { next(err); }
}

// POST /api/evaluations
export async function createEvaluation(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const evaluation = await Evaluation.create(value);
    res.status(201).json({ evaluation });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This user has already evaluated this seminar' });
    }
    next(err);
  }
}

// GET /api/evaluations/summary?seminarCode=SM101
export async function getEvaluationSummary(req, res, next) {
  try {
    const { seminarCode } = req.query;
    if (typeof seminarCode !== 'string' || !seminarCode.trim()) {
      return res.status(400).json({ message: 'seminarCode is required' });
    }

    const [summary] = await Evaluation.aggregate([
      { $match: { seminarCode } },
      { $group: { _id: '$seminarCode', averageScore: { $avg: '$score' }, evaluationCount: { $sum: 1 } } }
    ]);

    res.json({
      seminarCode,
      averageScore: summary?.averageScore ?? 0,
      evaluationCount: summary?.evaluationCount ?? 0
    });
  } catch (err) { next(err); }
}
