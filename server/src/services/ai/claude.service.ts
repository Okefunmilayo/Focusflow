import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';

const client = new Anthropic({ apiKey: env.anthropicApiKey });

// Model routing — Sonnet for complex tasks, Haiku for simple/fast tasks
const SONNET = 'claude-sonnet-4-6';
const HAIKU  = 'claude-haiku-4-5-20251001';

// Strip markdown code fences Claude sometimes adds despite instructions
const parseJSON = <T>(text: string): T => {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
};

// ── Goal Breakdown ────────────────────────────────────────
export interface GoalStep {
  phase:       string;
  week:        string;
  dailyTasks:  string[];
}

export const breakdownGoal = async (
  goal: string,
  deadline?: string,
  context?: string
): Promise<GoalStep[]> => {
  const message = await client.messages.create({
    model:      SONNET,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are a productivity expert. Break down this goal into an actionable plan.

Goal: ${goal}
${deadline ? `Deadline: ${deadline}` : ''}
${context  ? `Context: ${context}`   : ''}

Return ONLY a valid JSON array (no markdown, no explanation) in this exact format:
[
  {
    "phase": "Phase name",
    "week": "Week 1-2",
    "dailyTasks": ["Task 1", "Task 2", "Task 3"]
  }
]

Be specific, realistic, and actionable. Max 6 phases.`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
  return parseJSON<GoalStep[]>(text);
};

// ── Document Summary & Flashcards ─────────────────────────
export interface DocumentAnalysis {
  summary:    string;
  keyPoints:  string[];
  flashcards: { question: string; answer: string }[];
}

export const analyseDocument = async (content: string): Promise<DocumentAnalysis> => {
  const message = await client.messages.create({
    model:      SONNET,
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Analyse this document and return ONLY valid JSON (no markdown):
{
  "summary": "300-word executive summary",
  "keyPoints": ["point 1", "point 2", ...up to 10 points],
  "flashcards": [
    { "question": "Q?", "answer": "A" },
    ...up to 15 flashcards
  ]
}

Document content:
${content.slice(0, 150000)}`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
  return parseJSON<DocumentAnalysis>(text);
};

// ── Weekly AI Digest ──────────────────────────────────────
export interface DigestData {
  tasksCompleted: number;
  totalTasks:     number;
  focusHours:     number;
  topCategory?:   string;
  pendingTasks:   string[];
}

export interface DigestResult {
  summary:         string;
  improvements:    string[];
  recommendations: string[];
}

export const generateWeeklyDigest = async (data: DigestData): Promise<DigestResult> => {
  const message = await client.messages.create({
    model:      SONNET,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a personal productivity coach. Write a weekly review based on this data.

This week's stats:
- Tasks completed: ${data.tasksCompleted} / ${data.totalTasks}
- Focus hours logged: ${data.focusHours}h
- Most active category: ${data.topCategory ?? 'N/A'}
- Pending tasks: ${data.pendingTasks.join(', ') || 'none'}

Return ONLY valid JSON (no markdown):
{
  "summary": "2-3 sentence personalised summary of their week",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "recommendations": ["specific action for next week 1", "action 2", "action 3"]
}`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
  return parseJSON<DigestResult>(text);
};

// ── Task Suggestions (Haiku — fast & cheap) ───────────────
export const suggestTaskBreakdown = async (taskTitle: string): Promise<string[]> => {
  const message = await client.messages.create({
    model:      HAIKU,
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Break "${taskTitle}" into 3-5 subtasks. Return ONLY a JSON array of strings:
["subtask 1", "subtask 2", "subtask 3"]`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
  return parseJSON<string[]>(text);
};
