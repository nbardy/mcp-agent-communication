// New API verbs for agent communication
export type Verb = 'take' | 'take-blocking' | 'put' | 'put-blocking' | 'peek' | 'check-pending';

export interface Message {
  id: string;                 // UUID v4
  ts: number;                 // epoch‑ms (server‑stamped)
  description: string;
  agent_id: string;
  tags: string[];             // at least one tag
  content: unknown;
}

export interface PendingRequest {
  id: string;                 // UUID v4
  ts: number;                 // epoch‑ms when request was made
  agent_id: string;
  tags: string[];
  timeout: number;            // timeout in seconds
  resolve: (response: any) => void;
  reject: (error: Error) => void;
}

// ---------------- Requests ----------------

export interface TakeReq {
  verb: 'take';
  agent_ids?: string[];       // Filter by specific agents (optional)
  tags?: string[];            // Filter by specific tags (optional)
}

export interface TakeBlockingReq {
  verb: 'take-blocking';
  agent_ids?: string[];       // Filter by specific agents (optional)
  tags?: string[];            // Filter by specific tags (optional)
  timeout?: number;           // seconds (default 30)
}

export interface PutReq {
  verb: 'put';
  description: string;
  agent_id: string;
  tags: string[];
  content: unknown;
}

export interface PutBlockingReq {
  verb: 'put-blocking';
  description: string;
  agent_id: string;
  tags: string[];
  content: unknown;
  timeout?: number;           // seconds (default 30)
}

export interface PeekReq {
  verb: 'peek';
  agent_ids?: string[];       // Filter by specific agents (optional)
  tags?: string[];            // Filter by specific tags (optional)
}

export interface CheckPendingReq {
  verb: 'check-pending';
  agent_id?: string;          // Check pending for specific agent (optional)
}

export type Request = TakeReq | TakeBlockingReq | PutReq | PutBlockingReq | PeekReq | CheckPendingReq;

// ---------------- Responses ---------------
export type Resp =
  | { ok: true; message?: Message }                          // take (message if found)
  | { ok: true; message: Message }                           // take-blocking (always has message)
  | { ok: true; id: string }                                 // put
  | { ok: true; id: string; response?: Message }             // put-blocking (response if received)
  | { messages: Message[] }                                  // peek
  | { pending: Array<{id: string; agent_id: string; tags: string[]; ts: number}> } // check-pending
  | { error: string }; 