// AyuAahar - "Ask Ayu" wellness assistant (Groq via backend)
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Bot, Loader2, RotateCcw, Send, Sparkles, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import type { ChatMessage, Patient } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Disclaimer from '@/components/Disclaimer';

const PATIENT_PROMPTS = [
  'Explain my current diet plan in simple terms',
  'What should I eat for dinner to support my prakriti?',
  'How can I improve my digestion this week?',
  'Which foods should I limit, and why?',
];

const DIETITIAN_PROMPTS = [
  'Summarise this patient and suggest focus areas for the next visit',
  'Suggest Pitta-pacifying swaps for a hot summer week',
  'Explain rasa, guna, virya and vipaka for a new patient',
  'Draft three practical habits to improve plan adherence',
];

const GENERAL = 'general';

/** Minimal, injection-safe rendering of the model's markdown: paragraphs, bullet lists and **bold**. */
function renderInline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    );
}

function FormattedReply({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="ml-5 list-disc space-y-1">
          {list.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1]);
      continue;
    }
    flush();
    if (line) blocks.push(<p key={`p${blocks.length}`}>{renderInline(line.replace(/^#+\s*/, ''))}</p>);
  }
  flush();
  return <div className="space-y-2">{blocks}</div>;
}

export default function Assistant() {
  const { user } = useAuth();
  const isDietitian = user?.role === 'dietitian';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState<string>(GENERAL);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDietitian) return;
    api
      .getPatients()
      .then((res) => setPatients(res.patients))
      .catch(() => toast.error('Could not load your patients for context'));
  }, [isDietitian]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const send = async (text: string, history: ChatMessage[] = messages) => {
    const content = text.trim();
    if (!content || sending) return;
    const next: ChatMessage[] = [...history, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setFailed(null);
    setSending(true);
    try {
      // Keep the request small: the backend accepts the 20 most recent turns
      const res = await api.chat(next.slice(-20), patientId === GENERAL ? undefined : Number(patientId));
      setMessages([...next, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      const message = getErrorMessage(err, 'The assistant could not answer right now.');
      setFailed(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const retry = () => {
    const last = messages[messages.length - 1];
    if (last?.role === 'user') void send(last.content, messages.slice(0, -1));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const reset = () => {
    setMessages([]);
    setFailed(null);
  };

  const prompts = isDietitian ? DIETITIAN_PROMPTS : PATIENT_PROMPTS;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-forest-200/40 px-3 py-1 text-xs font-bold text-forest-900">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> AI assistant
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">Ask Ayu</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-500">
            {isDietitian
              ? 'Get quick explanations and ideas grounded in a patient’s prakriti, conditions and active plan.'
              : 'Ask about your prakriti, your diet plan and everyday habits. Answers use your profile and active plan.'}
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="self-start rounded-full sm:self-auto"
          >
            <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" /> New conversation
          </Button>
        )}
      </header>

      <Disclaimer compact />

      {isDietitian && (
        <div className="flex flex-col gap-1.5 sm:max-w-sm">
          <Label htmlFor="assistant-patient">Patient context</Label>
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger id="assistant-patient" className="rounded-xl bg-white">
              <SelectValue placeholder="General question" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GENERAL}>General question (no patient)</SelectItem>
              {patients.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name} · {p.prakriti}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <section
        aria-label="Conversation"
        className="flex min-h-[320px] flex-1 flex-col rounded-3xl bg-white/80 p-4 shadow-soft sm:p-6"
      >
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-950 to-forest-900 text-white shadow-lg shadow-forest-900/20">
              <Bot className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">How can I help today?</h2>
              <p className="mt-1 text-sm text-ink-500">Pick a starter or write your own question.</p>
            </div>
            <ul className="grid w-full gap-2 sm:grid-cols-2">
              {prompts.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => void send(p)}
                    className="h-full w-full rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-left text-sm font-medium text-ink-700 transition-colors hover:border-forest-300 hover:bg-forest-200/20"
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="flex flex-col gap-4" aria-live="polite" aria-busy={sending}>
            {messages.map((m, i) => (
              <li key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    m.role === 'user' ? 'bg-saffron-200 text-saffron-700' : 'bg-forest-900 text-white'
                  }`}
                >
                  {m.role === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </span>
                <div
                  className={`max-w-[85%] break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-forest-900 text-white' : 'bg-sand-100 text-ink'
                  }`}
                >
                  <span className="sr-only">{m.role === 'user' ? 'You said:' : 'Ayu said:'}</span>
                  {m.role === 'assistant' ? (
                    <FormattedReply text={m.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </li>
            ))}
            {sending && (
              <li className="flex gap-3" aria-label="Ayu is thinking">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-900 text-white"
                  aria-hidden="true"
                >
                  <Bot className="h-4 w-4" />
                </span>
                <div className="w-2/3 max-w-sm space-y-2 rounded-2xl bg-sand-100 px-4 py-3">
                  <div className="h-3 w-full animate-pulse rounded bg-sand-200" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-sand-200" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-sand-200" />
                </div>
              </li>
            )}
            {failed && !sending && (
              <li
                role="alert"
                className="flex flex-wrap items-center gap-3 rounded-2xl bg-danger-soft/50 px-4 py-3 text-sm text-danger"
              >
                <span className="flex-1">{failed}</span>
                <Button size="sm" variant="outline" onClick={retry} className="rounded-full">
                  Try again
                </Button>
              </li>
            )}
          </ol>
        )}
        <div ref={endRef} />
      </section>

      <form onSubmit={onSubmit} className="flex items-end gap-2 rounded-3xl bg-white p-2 shadow-soft">
        <Label htmlFor="assistant-input" className="sr-only">
          Your question
        </Label>
        <Textarea
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 2000))}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={2000}
          placeholder="Ask about foods, doshas or your plan..."
          className="max-h-40 min-h-[44px] flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button
          type="submit"
          disabled={!input.trim() || sending}
          aria-label="Send message"
          className="h-11 w-11 shrink-0 rounded-full bg-forest-900 p-0 hover:bg-forest-800"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </form>
    </div>
  );
}
