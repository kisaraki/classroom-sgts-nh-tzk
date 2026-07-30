import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const PAGES_PREFIX = "/classroom-sgts-nh-tzk";

const CONTENT_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"]
]);

const resolveRequestPath = (requestUrl, root) => {
  const url = new URL(requestUrl, "http://localhost");
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === PAGES_PREFIX) {
    pathname = "/";
  } else if (pathname.startsWith(`${PAGES_PREFIX}/`)) {
    pathname = pathname.slice(PAGES_PREFIX.length);
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const resolvedPath = path.resolve(root, relativePath);
  const rootPrefix = `${root}${path.sep}`;

  if (resolvedPath !== root && !resolvedPath.startsWith(rootPrefix)) {
    return null;
  }

  return resolvedPath;
};

const sendFile = async (filePath, response) => {
  const fileStat = await stat(filePath);

  if (!fileStat.isFile()) {
    throw new Error("Requested path is not a file.");
  }

  const contentType =
    CONTENT_TYPES.get(path.extname(filePath).toLowerCase()) ??
    "application/octet-stream";

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Length": fileStat.size,
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff"
  });
  createReadStream(filePath).pipe(response);
};

export const createStaticServer = ({ root = PROJECT_ROOT } = {}) =>
  createServer(async (request, response) => {
    try {
      const filePath = resolveRequestPath(request.url ?? "/", root);

      if (!filePath) {
        response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
      }

      await sendFile(filePath, response);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not Found");
    }
  });

const isCommandLineEntry =
  process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH;

if (isCommandLineEntry) {
  const host = process.env.SGTS_HOST ?? "127.0.0.1";
  const requestedPort = Number.parseInt(process.env.SGTS_PORT ?? "4173", 10);
  const port = Number.isInteger(requestedPort) ? requestedPort : 4173;
  const server = createStaticServer();

  server.listen(port, host, () => {
    const address = server.address();
    const activePort = typeof address === "object" && address ? address.port : port;

    process.stdout.write(
      `SGTS-NH server listening at http://${host}:${activePort}/ ` +
        `and http://${host}:${activePort}${PAGES_PREFIX}/\n`
    );
  });

  const closeServer = () => {
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", closeServer);
  process.on("SIGTERM", closeServer);
}
