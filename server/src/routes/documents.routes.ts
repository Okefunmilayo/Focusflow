import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import { analyseDocument } from '../services/ai/claude.service';

const router = Router();
router.use(protect);

// ── Multer setup ─────────────────────────────────────────────
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

// ── GET /documents ────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const docs = await prisma.document.findMany({
      where:   { userId },
      include: { flashcards: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ documents: docs });
  } catch {
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// ── POST /documents/upload ────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) { res.status(400).json({ message: 'No file uploaded' }); return; }
  const userId = (req as AuthRequest).userId!;

  try {
    // Pass filename as a stub — for production you'd extract PDF text with pdf-parse
    const fileContent = `[PDF document: ${file.originalname}]`;
    const analysis = await analyseDocument(fileContent);

    const doc = await prisma.document.create({
      data: {
        userId,
        filename:  file.originalname,
        fileUrl:   `/uploads/${file.filename}`,
        fileSize:  file.size,
        mimeType:  file.mimetype,
        summary:   analysis.summary,
        keyPoints: analysis.keyPoints,
        flashcards: {
          create: analysis.flashcards.map((fc: { question: string; answer: string }) => ({
            question: fc.question,
            answer:   fc.answer,
          })),
        },
      },
      include: { flashcards: true },
    });

    res.status(201).json({ document: doc });
  } catch (err) {
    console.error('[Documents] upload error:', err);
    res.status(500).json({ message: 'Analysis failed. Please try again.' });
  }
});

// ── DELETE /documents/:id ─────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const userId = (req as AuthRequest).userId!;
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!doc) { res.status(404).json({ message: 'Not found' }); return; }

    const filePath = path.join(process.cwd(), doc.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.document.delete({ where: { id: doc.id } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ message: 'Delete failed' });
  }
});

export default router;
