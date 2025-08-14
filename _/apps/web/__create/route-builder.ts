import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();

// Get current directory
const __dirname = join(fileURLToPath(new URL('.', import.meta.url)), '../src/app/api');
if (globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

// Recursively find all route.js files
async function findRouteFiles(dir: string): Promise<string[]> {
  const files = await readdir(dir);
  let routes: string[] = [];

  for (const file of files) {
    try {
      const filePath = join(dir, file);
      const statResult = await stat(filePath);

      if (statResult.isDirectory()) {
        routes = routes.concat(await findRouteFiles(filePath));
      } else if (file === 'route.js') {
        // Handle root route.js specially
        if (filePath === join(__dirname, 'route.js')) {
          routes.unshift(filePath); // Add to beginning of array
        } else {
          routes.push(filePath);
        }
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }

  return routes;
}

// Helper function to transform file path to Hono route path
function getHonoPath(routeFile: string): { name: string; pattern: string }[] {
  const relativePath = routeFile.replace(__dirname, '');
  const parts = relativePath.split('/').filter(Boolean);
  const routeParts = parts.slice(0, -1); // Remove 'route.js'
  if (routeParts.length === 0) {
    return [{ name: 'root', pattern: '' }];
  }
  const transformedParts = routeParts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [_, dots, param] = match;
      return dots === '...'
        ? { name: param, pattern: `:${param}{.+}` }
        : { name: param, pattern: `:${param}` };
    }
    return { name: segment, pattern: segment };
  });
  return transformedParts;
}

// Import and register all routes
async function registerRoutes() {
  const routeFiles = (
    await findRouteFiles(__dirname).catch((error) => {
      console.error('Error finding route files:', error);
      return [];
    })
  )
    .slice()
    .sort((a, b) => {
      return b.length - a.length;
    });

  // Clear existing routes
  api.routes = [];
  console.log(`Found ${routeFiles.length} route files to register`);

  let successfulRoutes = 0;
  let failedRoutes = 0;

  for (const routeFile of routeFiles) {
    try {
      // Convert Windows paths to file:// URLs for ESM imports
      const fileUrl = `file://${routeFile.replace(/\\/g, '/')}?update=${Date.now()}`;
      const route = await import(/* @vite-ignore */ fileUrl);

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      let routeHasMethods = false;

      for (const method of methods) {
        try {
          if (route[method]) {
            routeHasMethods = true;
            const parts = getHonoPath(routeFile);
            const honoPath = `/${parts.map(({ pattern }) => pattern).join('/')}`;
            console.log(`✓ Registering ${method} ${honoPath}`);
            const handler: Handler = async (c) => {
              const params = c.req.param();
              if (import.meta.env.DEV) {
                const updatedFileUrl = `file://${routeFile.replace(/\\/g, '/')}?update=${Date.now()}`;
                const updatedRoute = await import(
                  /* @vite-ignore */ updatedFileUrl
                );
                return await updatedRoute[method](c.req.raw, { params });
              }
              return await route[method](c.req.raw, { params });
            };
            const methodLowercase = method.toLowerCase();
            switch (methodLowercase) {
              case 'get':
                api.get(honoPath, handler);
                break;
              case 'post':
                api.post(honoPath, handler);
                break;
              case 'put':
                api.put(honoPath, handler);
                break;
              case 'delete':
                api.delete(honoPath, handler);
                break;
              case 'patch':
                api.patch(honoPath, handler);
                break;
              default:
                console.warn(`Unsupported method: ${method}`);
                break;
            }
          }
        } catch (error) {
          console.error(`✗ Error registering route ${routeFile} for method ${method}:`, error.message);
        }
      }

      if (routeHasMethods) {
        successfulRoutes++;
      }
    } catch (error) {
      failedRoutes++;
      console.error(`✗ Error importing route file ${routeFile}:`, error.message);
    }
  }

  console.log(`Route registration summary: ${successfulRoutes} successful, ${failedRoutes} failed`);
}

// Initial route registration
console.log('=== ROUTE BUILDER STARTING ===');
console.log('API directory:', __dirname);
await registerRoutes();
console.log('=== ROUTE BUILDER COMPLETED ===');

// Hot reload routes in development
if (import.meta.env.DEV) {
  import.meta.glob('../src/app/api/**/route.js', {
    eager: true,
  });
  if (import.meta.hot) {
    import.meta.hot.accept((newSelf) => {
      registerRoutes().catch((err) => {
        console.error('Error reloading routes:', err);
      });
    });
  }
}

console.log('=== API INSTANCE INFO ===');
console.log('API routes count:', api.routes?.length || 0);
console.log('API basename:', API_BASENAME);

export { api, API_BASENAME };
