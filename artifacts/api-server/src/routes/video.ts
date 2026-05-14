import { Router, type IRouter } from "express";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

router.get("/video/:id", (req, res): void => {
  const localPath = process.env["LOCAL_MUSIC_PATH"];

  if (!localPath) {
    res.status(503).json({ error: "LOCAL_MUSIC_PATH não configurado no servidor." });
    return;
  }

  const idParam = req.params.id;

  // Sanitize: only allow numeric IDs to prevent path traversal
  if (!/^\d+$/.test(idParam)) {
    res.status(400).json({ error: "ID inválido." });
    return;
  }

  const filePath = path.join(localPath, `${idParam}.mp4`);

  // Ensure the resolved path stays within localPath
  if (!filePath.startsWith(path.resolve(localPath))) {
    res.status(400).json({ error: "Caminho inválido." });
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.status(404).json({ error: "Arquivo de vídeo não encontrado." });
      return;
    }

    const fileSize = stat.size;
    const rangeHeader = req.headers.range;

    if (rangeHeader) {
      // Support range requests for video seeking
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0]!, 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      });

      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
      });

      fs.createReadStream(filePath).pipe(res);
    }
  });
});

export default router;
