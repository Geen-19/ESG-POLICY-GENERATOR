import { Policy } from '../models/policy.model.js';
import { nanoid } from 'nanoid';

export async function generatePolicy(req, res, next) {
  try {
    // Day 1: contract only; real Gemini call will be added on Day 2.
    // Validate body already via router-level parse.
    const { topic } = req.body;

    // stub empty doc so frontend flow can wire up now (optional)
    const policy = await Policy.create({
      topic,
      blocks: [
        { id: nanoid(6), type: 'heading', title: 'Draft', content: '—', order: 1 }
      ]
    });

    res.status(201).json(policy);
  } catch (err) {
    next(err);
  }
}

export async function getPolicy(req, res, next) {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) return res.status(404).json({ error: 'Not found' });
    res.json(policy);
  } catch (err) {
    next(err);
  }
}

export async function updateBlocks(req, res, next) {
  try {
    const { blocks } = req.body;
    const policy = await Policy.findByIdAndUpdate(
      req.params.id,
      { $set: { blocks, 'meta.modifiedAt': new Date() } },
      { new: true }
    );
    if (!policy) return res.status(404).json({ error: 'Not found' });
    res.json(policy);
  } catch (err) {
    next(err);
  }
}

export async function exportPolicy(_req, res, _next) {
  // Day 1: API shape only. We’ll implement server/client export next.
  res.status(501).json({ error: 'Export not implemented yet' });
}
