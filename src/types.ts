// Simple "verbs" our DSL supports
export type Verb = 'put!' | 'list' | 'read!' | 'gather!';

export interface Message {
  id: string;                 // UUID v4
  ts: number;                 // epoch‑ms (server‑stamped)
  description: string;
  agent_id: string;
  tags: string[];             // at least one tag
  content: unknown;
}

// ---------------- Requests ----------------
export interface PutReq {
  verb: 'put!';
  description: string;
  agent_id: string;
  tags: string[];
  content: unknown;
}

export interface ListReq {
  verb: 'list';
  agent_ids?: string[];
  tags?: string[];
}

export interface ReadReq {
  verb: 'read!';
  agent_ids?: string[];
  tags?: string[];
  since?: number;             // epoch‑ms
}

export interface GatherReq {
  verb: 'gather!';
  agent_ids: string[];
  tags: string[];
  timeout?: number;           // seconds (default 10)
}

export type Request = PutReq | ListReq | ReadReq | GatherReq;

// ---------------- Responses ---------------
export type Resp =
  | { ok: true; id: string }                                  // put!
  | { messages: Message[] }                                   // list/read!
  | { completed: string[][]; partial: boolean; messages: Message[] } // gather!
  | { error: string }; 