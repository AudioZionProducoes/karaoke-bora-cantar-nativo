import { Router, type IRouter } from "express";
import https from "https";
import { db } from "@workspace/db";
import { musicasTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const BUNNY_CDN = "vz-90f80c4b-2f5.b-cdn.net";

const router: IRouter = Router();

/**
 * Proxy video from Bunny Stream to bypass referer/CORS issues.
 * Supports HTTP Range requests so the browser can seek/scrub.
 * Uses https.get() for reliable streaming — no buffering.
 */
router.get("/video-proxy/:id", async (req, res): Promise<void> => {
  const idParam = req.params.id;

  let guid: string | null = null;

  if (/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(idParam)) {
    guid = idParam;
  } else if (/^\d+$/.test(idParam)) {
    const musicId = parseInt(idParam, 10);
    const [musica] = await db
      .select({ bunnyGuid: musicasTable.bunnyGuid })
      .from(musicasTable)
      .where(eq(musicasTable.id, musicId))
      .limit(1);
    guid = musica?.bunnyGuid ?? null;
  }

  if (!guid) {
    res.status(404).json({ error: "Vídeo não encontrado no catálogo." });
    return;
  }

  const resolution = (req.query.res as string) || "720p";
  const validResolutions = ["720p", "480p", "360p", "240p"];
  const resKey = validResolutions.includes(resolution) ? resolution : "720p";

  const path = `/${guid}/play_${resKey}.mp4`;

  // Forward the client's Range header
  const rangeHeader = req.headers.range;

  const options: https.RequestOptions = {
    hostname: BUNNY_CDN,
    port: 443,
    path,
    method: "GET",
    headers: {
      Referer: "https://karaokeboracantar.com.br/",
      "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
      ...(rangeHeader ? { Range: rangeHeader } : {}),
    },
  };

  const bunnyReq = https.request(options, (bunnyRes) => {
    if (bunnyRes.statusCode === 403) {
      // Try lower resolution
      const fallbackPath = `/${guid}/play_360p.mp4`;
      const fallbackOptions: https.RequestOptions = {
        hostname: BUNNY_CDN,
        port: 443,
        path: fallbackPath,
        method: "GET",
        headers: options.headers,
      };

      https.request(fallbackOptions, (fallbackRes) => {
        res.status(fallbackRes.statusCode || 200);
        fallbackRes.headers && Object.entries(fallbackRes.headers).forEach(([key, value]) => {
          if (["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"].includes(key.toLowerCase())) {
            res.setHeader(key, value as string);
          }
        });
        res.setHeader("Access-Control-Allow-Origin", "*");
        fallbackRes.pipe(res);
        fallbackRes.on("error", (err) => {
          req.log?.error?.({ err }, "Erro no fallback stream de vídeo");
          if (!res.writableEnded) res.end();
        });
      }).on("error", (err) => {
        req.log?.error?.({ err }, "Erro na requisição fallback de vídeo");
        if (!res.headersSent) res.status(502).json({ error: "Erro ao buscar vídeo do Bunny." });
        else if (!res.writableEnded) res.end();
      }).end();

      return;
    }

    if (!bunnyRes.statusCode || bunnyRes.statusCode >= 400) {
      if (!res.headersSent) {
        res.status(502).json({ error: `Bunny Stream erro: ${bunnyRes.statusCode}` });
      }
      return;
    }

    // Stream back to client
    res.status(bunnyRes.statusCode);
    bunnyRes.headers && Object.entries(bunnyRes.headers).forEach(([key, value]) => {
      if (["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"].includes(key.toLowerCase())) {
        res.setHeader(key, value as string);
      }
    });
    res.setHeader("Access-Control-Allow-Origin", "*");

    bunnyRes.pipe(res);
    bunnyRes.on("error", (err) => {
      req.log?.error?.({ err }, "Erro no stream de vídeo");
      if (!res.writableEnded) res.end();
    });
  });

  bunnyReq.on("error", (err) => {
    req.log?.error?.({ err }, "Erro na requisição de vídeo");
    if (!res.headersSent) res.status(500).json({ error: "Erro interno ao buscar vídeo." });
    else if (!res.writableEnded) res.end();
  });

  bunnyReq.end();
});

export default router;
