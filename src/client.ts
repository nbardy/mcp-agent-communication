import net from 'net';
import readline from 'readline';
import { Request, Resp } from './types.ts';

export class MCPClient {
  private rl: readline.Interface;
  private sock: net.Socket;
  private pending: ((v: Resp) => void)[] = [];

  constructor(host = '127.0.0.1', port = 4545) {
    this.sock = net.connect(port, host);
    this.rl = readline.createInterface({ input: this.sock });
    this.rl.on('line', (line) => {
      const handler = this.pending.shift();
      if (handler) handler(JSON.parse(line));
    });
  }
  send(req: Request): Promise<Resp> {
    return new Promise<Resp>((res) => {
      this.pending.push(res);
      this.sock.write(JSON.stringify(req) + '\n');
    });
  }
} 