import express from "express";
import httpProxy from "http-proxy";

const router = express.Router();
const proxy = httpProxy.createProxyServer({});

// URL of your FastAPI service
const FASTAPI_URL = "http://localhost:8001";

// Log any proxy errors
proxy.on("error", (err) => {
  console.error("❌ Proxy error:", err.message);
});

// --- Fetch vessel info ---
router.get("/:imo", (req, res) => {
  proxy.web(req, res, { target: `${FASTAPI_URL}/vessel/${req.params.imo}` });
});

// --- SSE live tracking ---
router.get("/track/:imo", (req, res) => {
  // Ensure headers are correct for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  proxy.web(req, res, {
    target: `${FASTAPI_URL}/track/${req.params.imo}/sse`,
    ws: true,
  });
});

// --- (Optional) Vessel history ---
router.get("/history/:imo", (req, res) => {
  proxy.web(req, res, { target: `${FASTAPI_URL}/history/${req.params.imo}` });
});

export default router;
