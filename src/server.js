import net from 'net';
import readline from 'readline';
import { dispatch } from './bank';
export const startServer = (port = 4545) => {
    const server = net.createServer((sock) => {
        const rl = readline.createInterface({ input: sock });
        rl.on('line', async (line) => {
            try {
                const req = JSON.parse(line);
                const resp = await dispatch(req);
                sock.write(JSON.stringify(resp) + '\n');
            }
            catch (err) {
                sock.write(JSON.stringify({ error: 'bad-request' }) + '\n');
            }
        });
    });
    server.listen(port, () => console.log(`MCP listening on ${port}`));
};
