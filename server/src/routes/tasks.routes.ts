import { Router } from 'express';
import { getTasks, createTask, updateTask, deleteTask, updateTaskStatus } from '../controllers/tasks.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/',                  getTasks);
router.post('/',                 createTask);
router.put('/:id',               updateTask);
router.delete('/:id',            deleteTask);
router.patch('/:id/status',      updateTaskStatus);

export default router;
