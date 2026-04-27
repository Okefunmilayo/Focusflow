import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Loader2, ChevronDown, ChevronUp, Trash2, BookOpen, Sparkles } from 'lucide-react';
import { api } from '@/services/api';

interface Flashcard { id: string; question: string; answer: string; }
interface Document {
  id: string; filename: string; fileUrl: string;
  summary?: string; keyPoints?: string[];
  flashcards: Flashcard[]; createdAt: string;
}

function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
  const [idx, setIdx]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  if (!cards.length) return null;
  const card = cards[idx];
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500">Flashcard {idx + 1} / {cards.length}</span>
        <div className="flex gap-1">
          <button disabled={idx === 0} aria-label="Previous flashcard"
            onClick={() => { setIdx(i => i - 1); setFlipped(false); }}
            className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Prev</button>
          <button disabled={idx === cards.length - 1} aria-label="Next flashcard"
            onClick={() => { setIdx(i => i + 1); setFlipped(false); }}
            className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Next</button>
        </div>
      </div>
      <button onClick={() => setFlipped(f => !f)} aria-pressed={flipped}
        aria-label={flipped ? 'Showing answer, click to see question' : 'Showing question, click to see answer'}
        className="cursor-pointer min-h-32 w-full rounded-xl border-2 border-violet-200 bg-violet-50 p-5 flex flex-col items-center justify-center text-center select-none transition-all hover:border-violet-400">
        <span className="text-xs font-semibold uppercase tracking-wide text-violet-400 mb-2">
          {flipped ? 'Answer' : 'Question — tap to flip'}
        </span>
        <p className="text-sm text-slate-800 font-medium">{flipped ? card.answer : card.question}</p>
      </button>
    </div>
  );
}

function DocumentCard({ doc, onDelete }: { doc: Document; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{doc.filename}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {doc.flashcards?.length > 0 && (
                <span className="ml-2 text-violet-500 font-medium">{doc.flashcards.length} flashcards</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={open ? 'Hide document details' : 'View document details'}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
            {open ? <><ChevronUp className="w-3.5 h-3.5" /> Hide</> : <><ChevronDown className="w-3.5 h-3.5" /> View</>}
          </button>
          <button onClick={() => onDelete(doc.id)} aria-label={`Delete ${doc.filename}`}
            className="text-slate-300 hover:text-red-500 transition-colors p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          {doc.summary && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" aria-hidden="true" />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">AI Summary</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{doc.summary}</p>
            </div>
          )}
          {doc.keyPoints && doc.keyPoints.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Key Points</p>
              <ul className="space-y-1.5">
                {doc.keyPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" aria-hidden="true" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {doc.flashcards?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-violet-500" aria-hidden="true" />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Flashcards</span>
              </div>
              <FlashcardDeck cards={doc.flashcards} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  const [dragOver,    setDragOver]    = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ documents: Document[] }>({
    queryKey: ['documents'],
    queryFn:  () => api.get('/documents').then(r => r.data),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete('/documents/' + id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });

  const documents = data?.documents ?? [];

  const uploadFile = async (file: File) => {
    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) { setUploadError('Only PDF files are supported'); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError('File must be under 10 MB'); return; }
    setUploadError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post('/documents/upload', form);
      qc.invalidateQueries({ queryKey: ['documents'] });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data;
      setUploadError(detail?.detail ?? detail?.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-slate-500 text-sm mt-0.5">Upload PDFs — Claude will summarise them and generate flashcards automatically.</p>
      </div>

      <div role="button" tabIndex={0}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        aria-label="Upload PDF file — click or drag and drop"
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-colors mb-6 sm:mb-8 ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
        }`}>
        <input ref={inputRef} type="file" accept=".pdf" className="hidden" aria-label="Choose PDF file"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 animate-spin mb-3" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">Analysing with Claude AI…</p>
            <p className="text-xs text-slate-400 mt-1">This may take 10–30 seconds</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">Drop a PDF here or tap to browse</p>
            <p className="text-xs text-slate-400 mt-1">PDF only · max 10 MB</p>
          </>
        )}
      </div>

      {uploadError && (
        <div role="alert" className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{uploadError}</div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16" role="status" aria-label="Loading documents">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" aria-hidden="true" />
          <p className="text-slate-400 text-sm">No documents yet — upload your first PDF above</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {documents.map(doc => (
            <DocumentCard key={doc.id} doc={doc} onDelete={(id) => deleteMutation.mutate(id)} />
          ))}
        </div>
      )}
      <p className="text-center text-xs text-slate-300 mt-8 sm:mt-10">
        Powered by Claude Sonnet 4.6 · Summaries generated by Anthropic AI
      </p>
    </div>
  );
}
