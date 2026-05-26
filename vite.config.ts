import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'vercel-api-dev-server',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              if (req.url?.startsWith('/api/gemini')) {
                try {
                  // Read body if POST
                  let body = '';
                  req.on('data', chunk => {
                    body += chunk;
                  });
                  req.on('end', async () => {
                    const parsedBody = body ? JSON.parse(body) : {};
                    
                    // Create mock express-like req and res
                    const mockReq = Object.assign(req, { body: parsedBody });
                    
                    const mockRes = Object.assign(res, {
                      status(code: number) {
                        res.statusCode = code;
                        return mockRes;
                      },
                      json(data: any) {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                        return mockRes;
                      }
                    });

                    // Dynamic import of the vercel function handler via Vite's SSR runtime
                    const { default: handler } = await server.ssrLoadModule('./api/gemini.ts');
                    await handler(mockReq, mockRes);
                  });
                } catch (error: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: error.message || 'Local API handler failed' }));
                }
              } else {
                next();
              }
            });
          }
        }
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

