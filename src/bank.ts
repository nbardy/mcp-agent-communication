import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import {
  Message, PendingRequest, TakeReq, TakeBlockingReq, PutReq, PutBlockingReq, 
  PeekReq, CheckPendingReq, Resp
} from './types.js';

// Global stores
const messages: Message[] = [];                    // Message queue
const pendingRequests: Map<string, PendingRequest> = new Map(); // Blocking requests waiting for responses

// EventEmitter for message notifications
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

const findAndRemoveMessage = (filters: { agent_ids?: string[]; tags?: string[] }): Message | null => {
  const index = messages.findIndex(m => matches(filters, m));
  if (index === -1) return null;
  return messages.splice(index, 1)[0];
};

// ---------- API Handlers ----------

/**
 * take: Check for a message and return it if found (non-blocking)
 * Removes the message from memory after taking it.
 * Use when: You want to check for messages without waiting
 */
export const handleTake = (r: TakeReq): Resp => {
  const message = findAndRemoveMessage(r);
  return { ok: true, message: message || undefined };
};

/**
 * take-blocking: Wait for a message and return it (blocking)
 * Removes the message from memory after taking it.
 * Use when: You want to wait for a specific message to arrive
 */
export const handleTakeBlocking = async (r: TakeBlockingReq): Promise<Resp> => {
  // First check if message already exists
  const existingMessage = findAndRemoveMessage(r);
  if (existingMessage) {
    return { ok: true, message: existingMessage };
  }

  // Wait for new message
  const timeoutMs = (r.timeout ?? 30) * 1000;
  return new Promise<Resp>((resolve) => {
    const onMsg = (m: Message) => {
      if (matches(r, m)) {
        // Remove the message from queue since we're taking it
        const index = messages.findIndex(msg => msg.id === m.id);
        if (index !== -1) {
          const takenMessage = messages.splice(index, 1)[0];
          cleanup();
          resolve({ ok: true, message: takenMessage });
        }
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({ error: 'timeout: no matching message received' });
    }, timeoutMs);

    const cleanup = () => {
      bus.off('put', onMsg);
      clearTimeout(timer);
    };

    bus.on('put', onMsg);
  });
};

/**
 * put: Send a message without waiting for a response (non-blocking)
 * Use when: You want to send a message and continue immediately
 */
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

/**
 * put-blocking: Send a message and wait for a response (blocking)
 * Use when: You need to wait for a review or response before continuing
 */
export const handlePutBlocking = async (r: PutBlockingReq): Promise<Resp> => {
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
  
  const timeoutMs = (r.timeout ?? 30) * 1000;
  const requestId = randomUUID();
  
  return new Promise<Resp>((resolve, reject) => {
    const pendingRequest: PendingRequest = {
      id: requestId,
      ts: now(),
      agent_id: r.agent_id,
      tags: r.tags,
      timeout: r.timeout ?? 30,
      resolve,
      reject
    };
    
    pendingRequests.set(requestId, pendingRequest);
    
    // Look for response message with matching criteria
    const onResponseMsg = (responseMsg: Message) => {
      // Check if this is a response to our message (you might want to customize this logic)
      // For now, we'll consider it a response if it has overlapping tags and different agent
      if (responseMsg.agent_id !== r.agent_id && 
          responseMsg.tags.some(tag => r.tags.includes(tag))) {
        cleanup();
        resolve({ ok: true, id: msg.id, response: responseMsg });
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({ ok: true, id: msg.id }); // Return without response on timeout
    }, timeoutMs);

    const cleanup = () => {
      pendingRequests.delete(requestId);
      bus.off('put', onResponseMsg);
      clearTimeout(timer);
    };

    bus.on('put', onResponseMsg);
  });
};

/**
 * peek: Look at messages without removing them from memory
 * Use when: You want to check what messages are available without consuming them
 */
export const handlePeek = (r: PeekReq): Resp => ({
  messages: messages.filter(m => matches(r, m)),
});

/**
 * check-pending: Check for currently blocking requests waiting on a response
 * Use when: You want to see what requests are still waiting for responses
 */
export const handleCheckPending = (r: CheckPendingReq): Resp => {
  const pending = Array.from(pendingRequests.values())
    .filter(req => !r.agent_id || req.agent_id === r.agent_id)
    .map(req => ({
      id: req.id,
      agent_id: req.agent_id,
      tags: req.tags,
      ts: req.ts
    }));
  
  return { pending };
};

// -------------- dispatch ---------------
export const dispatch = async (req: unknown): Promise<Resp> => {
  if (!req || typeof req !== 'object') return { error: 'invalid-json' };
  const r = req as any;
  
  try {
    switch (r.verb) {
      case 'take':         return handleTake(r);
      case 'take-blocking': return await handleTakeBlocking(r);
      case 'put':          return handlePut(r);
      case 'put-blocking': return await handlePutBlocking(r);
      case 'peek':         return handlePeek(r);
      case 'check-pending': return handleCheckPending(r);
      default:             return { error: 'unknown-verb' };
    }
  } catch (error: any) {
    return { error: error.message };
  }
}; 