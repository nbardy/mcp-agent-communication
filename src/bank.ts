import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import {
  Message, PutReq, ListReq, ReadReq, GatherReq, Resp
} from './types.ts';

// Single global store (swap for DB if desired)
const messages: Message[] = [];

// EventEmitter notifies every new put!
const bus = new EventEmitter();
bus.setMaxListeners(0);     // avoid warning for many agents

// ---------- helpers ----------
const now = () => Date.now();

const matches = (
  { agent_ids = [], tags = [] }: { agent_ids?: string[]; tags?: string[] },
  m: Message
) =>
  (agent_ids.length === 0 || agent_ids.includes(m.agent_id)) &&
  (tags.length === 0 || m.tags.some(t => tags.includes(t)));

export const handlePut = (r: PutReq): Resp => {
  const msg: Message = {
    id: randomUUID(),
    ts: now(),
    description: r.description,
    agent_id: r.agent_id,
    tags: r.tags,
    content: r.content,
  };
  messages.push(msg);
  bus.emit('put', msg);
  return { ok: true, id: msg.id };
};

export const handleList = (r: ListReq): Resp => ({
  messages: messages.filter(m => matches(r, m)),
});

export const handleRead = (r: ReadReq): Resp => ({
  messages: messages.filter(
    m => m.ts > (r.since ?? 0) && matches(r, m)
  ),
});

export const handleGather = async (r: GatherReq): Promise<Resp> => {
  const required = new Set(
    r.agent_ids.flatMap(a => r.tags.map(t => `${a}|${t}`))
  );
  const seen = new Set<string>();

  const checkMsg = (m: Message) => {
    if (matches(r, m)) {
      for (const tag of m.tags)
        if (r.tags.includes(tag) && r.agent_ids.includes(m.agent_id))
          seen.add(`${m.agent_id}|${tag}`);
    }
    return required.size === seen.size;
  };

  // first consume existing messages
  messages.forEach(checkMsg);

  if (required.size === seen.size) {
    return {
      completed: [...seen].map(s => s.split('|')),
      partial: false,
      messages: messages.filter(m => matches(r, m)),
    };
  }

  // otherwise wait
  const timeoutMs = (r.timeout ?? 10) * 1000;
  return new Promise<Resp>((resolve) => {
    const onMsg = (m: Message) => {
      if (checkMsg(m)) {
        cleanup();
        resolve({
          completed: [...seen].map(s => s.split('|')),
          partial: false,
          messages: messages.filter(mm => matches(r, mm)),
        });
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({
        completed: [...seen].map(s => s.split('|')),
        partial: true,
        messages: messages.filter(m => matches(r, m)),
      });
    }, timeoutMs);

    const cleanup = () => {
      bus.off('put', onMsg);
      clearTimeout(timer);
    };

    bus.on('put', onMsg);
  });
};

// -------------- dispatch ---------------
export const dispatch = async (req: unknown): Promise<Resp> => {
  if (!req || typeof req !== 'object') return { error: 'invalid-json' };
  const r = req as any;
  switch (r.verb) {
    case 'put!':    return handlePut(r);
    case 'list':    return handleList(r);
    case 'read!':   return handleRead(r);
    case 'gather!': return handleGather(r);
    default:        return { error: 'unknown-verb' };
  }
}; 