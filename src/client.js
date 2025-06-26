import net from 'net';
import readline from 'readline';
export class MCPClient {
    rl;
    sock;
    pending = [];
    constructor(host = '127.0.0.1', port = 4545) {
        this.sock = net.connect(port, host);
        this.rl = readline.createInterface({ input: this.sock });
        this.rl.on('line', (line) => {
            const handler = this.pending.shift();
            if (handler)
                handler(JSON.parse(line));
        });
    }
    send(req) {
        return new Promise((res) => {
            this.pending.push(res);
            this.sock.write(JSON.stringify(req) + '\n');
        });
    }
}
