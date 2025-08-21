import { Policy } from '../models/policy.model.js';
import { nanoid } from 'nanoid';
import { TopicZ } from '../validators/policies.schema.js';
import logger from '../lib/logger.js';
import { generatePolicyBlocks } from '../services/gemini.service.js';
export async function generatePolicy(req, res, next) {
  try {
    const { topic } = TopicZ.parse(req.body); // -> 400 on fail (handled by middleware)
    const blocks = await generatePolicyBlocks(topic); // -> 503 on Gemini parse/down

    const policy = await Policy.create({
      topic,
      blocks,
      meta: { generatedBy: "gemini", createdAt: new Date(), modifiedAt: new Date() }
    });

    logger.info({ policyId: policy._id, topic }, "Policy generated and saved");
    return res.status(201).json(policy);
  } catch (err) {
    return next(err);
  }
}

export async function getPolicyById(req, res, next) {
  try {
    const { id } = req.params;
    const policy = await Policy.findById(id);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }
    return res.json(policy);
  } catch (err) {
    return next(err);
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


