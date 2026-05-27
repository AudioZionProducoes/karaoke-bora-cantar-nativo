import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { musicasTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const BUNNY_CDN = "https://vz-90f80c4b-2f5.b-cdn.net";

const router: IRouter = Router();

/**
 * Proxy video from Bunny Stream to bypass referer/CORS issues.
 * The browser requests this endpoint (same origin) and the server
 * fetches from Bunny with proper referer, then streams the MP4 back.
 * This also avoids HLS codec errors since we serve MP4 directly.
 */
router.get("/video-proxy/:id", async (req, res): Promise<void> => {
  const idParam = req.params.id;

  let guid: string | null = null;

  if (/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(idParam)) {
    // Already a Bunny GUID
    guid = idParam;
  } else if (/^\d+$/.test(idParam)) {
    // Numeric music ID — look up bunnyGuid
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

  // Determine resolution from query param (default 720p)
  const resolution = (req.query.res as string) || "720p";
  const validResolutions = ["720p", "480p", "360p", "240p"];
  const resKey = validResolutions.includes(resolution) ? resolution : "720p";

  const bunnyUrl = `${BUNNY_CDN}/${guid}/play_${resKey}.mp4`;

  try {
    const bunnyResponse = await fetch(bunnyUrl, {
      headers: {
        Referer: "https://karaokeboracantar.com.br/",
        "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
      },
    });

    if (!bunnyResponse.ok) {
      if (bunnyResponse.status === 403) {
        // Bunny blocked the request — try lower resolution
        const fallbackUrl = `${BUNNY_CDN}/${guid}/play_360p.mp4`;
        const fallbackResp = await fetch(fallbackUrl, {
          headers: {
            Referer: "https://karaokeboracantar.com.br/",
            "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
          },
        });

        if (!fallbackResp.ok) {
          res.status(502).json({ error: "Bunny Stream retornou erro de acesso." });
          return;
        }

        // Stream fallback
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");
        if (fallbackResp.headers.get("content-length")) {
          res.setHeader("Content-Length", fallbackResp.headers.get("content-length")!);
        }

        const reader = fallbackResp.body?.getReader();
        if (!reader) {
          res.status(500).json({ error: "Falha ao ler stream de vídeo." });
          return;
        }

        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            res.write(Buffer.from(value));
          }
        }
        res.end();
        return;
      }

      res.status(502).json({ error: `Bunny Stream erro: ${bunnyResponse.status}` });
      return;
    }

    // Stream the video to the client
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    if (bunnyResponse.headers.get("content-length")) {
      res.setHeader("Content-Length", bunnyResponse.headers.get("content-length")!);
    }

    const reader = bunnyResponse.body?.getReader();
    if (!reader) {
      res.status(500).json({ error: "Falha ao ler stream de vídeo." });
      return;
    }

    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        res.write(Buffer.from(value));
      }
    }
    res.end();
  } catch (err) {
    req.log?.error?.({ err }, "Erro no proxy de vídeo");
    res.status(500).json({ error: "Erro interno ao buscar vídeo." });
  }
});

export default router;
