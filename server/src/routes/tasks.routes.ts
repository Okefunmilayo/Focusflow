import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { getTasks, createTask, updateTask, deleteTask, updateTaskStatus } from '../controllers/tasks.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();
router.use(protect);

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(422).json({ message: errors.array()[0].msg }); return; }
  next();
};

const createRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title too long'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
  body('category').optional().isIn(['WORK', 'STUDY', 'PERSONAL']).withMessage('Invalid category'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
];

const statusRules = [
  body('status').isIn(['TODO', 'IN_PROGRESS', 'DONE']).withMessage('Invalid status'),
];

router.get('/',             getTasks);
router.post('/',            createRules, validate, createTask);
router.put('/:id',          createRules, validate, updateTask);
router.delete('/:id',       deleteTask);
router.patch('/:id/status', statusRules, validate, updateTaskStatus);

export default router;
