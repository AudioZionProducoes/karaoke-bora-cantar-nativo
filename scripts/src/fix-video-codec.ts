/**
 * Script para converter áudio AC3 → AAC em vídeos do Bunny Stream.
 *
 * 1. Baixa o MP4 do Bunny Stream (via proxy ou direto com referer)
 * 2. Converte áudio AC3 → AAC usando FFmpeg
 * 3. Faz upload do vídeo convertido de volta ao Bunny Stream
 * 4. Atualiza o bunnyGuid no banco de dados
 *
 * Uso:
 *   pnpm --filter @workspace/scripts run fix-video-codec -- --id 20759
 *   pnpm --filter @workspace/scripts run fix-video-codec -- --all
 *
 * Variáveis de ambiente necessárias:
 *   BUNNY_API_KEY     — API Key da biblioteca Bunny Stream
 *   BUNNY_LIBRARY_ID  — ID da biblioteca (default: 670590)
 *   DATABASE_URL      — Postgres connection string
 */

import https from "https";
import { Pool } from "pg";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const BUNNY_CDN = "vz-90f80c4b-2f5.b-cdn.net";

async function downloadVideo(guid: string, resolution: string, outputPath: string): Promise<void> {
  console.log(`📥 Baixando vídeo ${guid} (${resolution})...`);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);

    const req = https.request(
      {
        hostname: BUNNY_CDN,
        port: 443,
        path: `/${guid}/play_${resolution}.mp4`,
        method: "GET",
        headers: {
          Referer: "https://karaokeboracantar.com.br/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Download falhou: HTTP ${res.statusCode}`));
          return;
        }

        res.pipe(file);
        file.on("finish", () => {
          file.close();
          const stats = fs.statSync(outputPath);
          console.log(`   ✅ Download concluído: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
          resolve();
        });
        res.on("error", (err: Error) => {
          file.close();
          reject(err);
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

function convertAudio(inputPath: string, outputPath: string): void {
  console.log(`🔄 Convertendo áudio AC3 → AAC...`);
  console.log(`   Input: ${inputPath}`);
  console.log(`   Output: ${outputPath}`);

  try {
    execSync(
      `ffmpeg -y -i "${inputPath}" -c:v copy -c:a aac -b:a 192k -ac 2 "${outputPath}"`,
      { stdio: "inherit" }
    );

    const stats = fs.statSync(outputPath);
    console.log(`   ✅ Conversão concluída: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
  } catch (err) {
    throw new Error(`FFmpeg falhou: ${err}`);
  }
}

async function uploadToBunny(
  filePath: string,
  title: string,
  apiKey: string,
  libraryId: string
): Promise<string> {
  console.log(`🚀 Fazendo upload para Bunny Stream...`);

  const collectionId = "";
  const createUrl = `https://video.bunnycdn.com/library/${libraryId}/videos`;

  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({})) as { Message?: string };
    throw new Error(`Erro ao criar vídeo: ${createRes.status} - ${err.Message || "unknown"}`);
  }

  const createData = await createRes.json() as { guid: string };
  const guid = createData.guid;
  console.log(`   ✅ Vídeo criado: ${guid}`);

  const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`;
  const fileBuffer = fs.readFileSync(filePath);

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: fileBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({})) as { Message?: string };
    throw new Error(`Erro no upload: ${uploadRes.status} - ${err.Message || "unknown"}`);
  }

  console.log(`   ✅ Upload concluído!`);

  // Wait for encoding
  console.log(`⏳ Aguardando codificação do Bunny...`);
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 5000));
    attempts++;

    const statusRes = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`,
      { headers: { AccessKey: apiKey } }
    );

    if (statusRes.ok) {
      const statusData = await statusRes.json() as { status: number; encodeProgress: number };
      const status = statusData.status;
      const progress = statusData.encodeProgress;

      if (status === 4) {
        console.log(`   ✅ Codificação concluída em ${attempts * 5}s!`);
        return guid;
      }

      console.log(`   ⏳ Status ${status}, progresso ${progress}% (${attempts * 5}s)...`);
    }
  }

  throw new Error(`Codificação não concluída após ${maxAttempts * 5}s`);
}

async function updateDatabase(pool: Pool, musicId: number, newGuid: string): Promise<void> {
  await pool.query(
    `UPDATE musicas SET bunny_guid = $1 WHERE id = $2`,
    [newGuid, musicId]
  );
  console.log(`   📅 Banco de dados atualizado: ID ${musicId} → ${newGuid}`);
}

async function deleteOldVideo(guid: string, apiKey: string, libraryId: string): Promise<void> {
  console.log(`🗑️ Removendo vídeo antigo ${guid}...`);
  const resp = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`,
    {
      method: "DELETE",
      headers: { AccessKey: apiKey },
    }
  );
  if (resp.ok || resp.status === 404) {
    console.log(`   ✅ Vídeo antigo removido`);
  } else {
    console.log(`   ⚠️ Erro ao remover: ${resp.status}`);
  }
}

async function fixVideoCodec(args: string[]): Promise<void> {
  const apiKey = process.env.BUNNY_API_KEY;
  const libraryId = process.env.BUNNY_LIBRARY_ID || "670590";

  if (!apiKey) {
    console.error("❌ BUNNY_API_KEY não definida.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não definida.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bunny-fix-"));

  try {
    // Get musicas that need fixing
    const musicIds: number[] = [];

    if (args.includes("--all")) {
      const result = await pool.query(
        `SELECT id, artista, musica, bunny_guid FROM musicas WHERE bunny_guid IS NOT NULL ORDER BY id`
      );
      for (const row of result.rows) {
        musicIds.push(row.id);
        console.log(`🎵 ${row.id}: ${row.artista} — ${row.musica} (GUID: ${row.bunny_guid})`);
      }
    } else {
      const idArg = args.find((a) => a.startsWith("--id="));
      if (idArg) {
        const id = parseInt(idArg.split("=")[1], 10);
        if (!isNaN(id)) musicIds.push(id);
      }
    }

    if (musicIds.length === 0) {
      console.log("⚠️ Nenhum ID especificado. Use --id=12345 ou --all");
      process.exit(1);
    }

    for (const musicId of musicIds) {
      console.log(`\n═════════════════════════════════════════════════`);
      console.log(`🚀 Processando música ID ${musicId}...`);
      console.log(`═════════════════════════════════════════════════`);

      // Get current bunnyGuid
      const result = await pool.query(
        `SELECT id, artista, musica, bunny_guid FROM musicas WHERE id = $1`,
        [musicId]
      );
      if (result.rows.length === 0) {
        console.log(`❌ Música ${musicId} não encontrada`);
        continue;
      }
      const row = result.rows[0];
      const oldGuid = row.bunny_guid as string;
      console.log(`🎵 ${row.artista} — ${row.musica}`);
      console.log(`   GUID atual: ${oldGuid}`);

      const inputPath = path.join(tmpDir, `${musicId}_original.mp4`);
      const outputPath = path.join(tmpDir, `${musicId}_aac.mp4`);

      try {
        await downloadVideo(oldGuid, "720p", inputPath);
        convertAudio(inputPath, outputPath);
        const newGuid = await uploadToBunny(outputPath, `${musicId}.mp4`, apiKey, libraryId);
        await updateDatabase(pool, musicId, newGuid);
        await deleteOldVideo(oldGuid, apiKey, libraryId);
        console.log(`✅ Música ${musicId} processada com sucesso! Novo GUID: ${newGuid}`);
      } catch (err) {
        console.error(`❌ Erro ao processar ${musicId}:`, err);
      } finally {
        // Cleanup temp files
        try { fs.unlinkSync(inputPath); } catch { /* ignore */ }
        try { fs.unlinkSync(outputPath); } catch { /* ignore */ }
      }
    }

    console.log("\n==================================================");
    console.log("✅ Processamento concluído!");

  } finally {
    await pool.end();
    // Cleanup tmp dir
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch { /* ignore */ }
  }
}

fixVideoCodec(process.argv.slice(2)).catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
