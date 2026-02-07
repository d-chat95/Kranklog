import app, { log } from "./app";
import { serveStatic } from "./static";
import { createServer } from "http";

const httpServer = createServer(app);

(async () => {
  // In production, serve the built client files
  // In development, use Vite dev server for HMR
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
