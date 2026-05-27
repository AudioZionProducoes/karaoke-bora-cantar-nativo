/**
 * Script de sincronização automática de GUIDs do Bunny Stream.
 *
 * Lista todos os vídeos da biblioteca Bunny e faz match automático
 * pelo nome do arquivo (ex: "20758.mp4" → musica.id = 20758).
 *
 * Uso:
 *   pnpm --filter @workspace/scripts run sync-bunny-guids
 *
 * Variáveis de ambiente necessárias:
 *   BUNNY_API_KEY     — API Key da biblioteca Bunny Stream
 *   BUNNY_LIBRARY_ID  — ID da biblioteca (default: 670590)
 *   DATABASE_URL      — Postgres connection string
 */

import { Pool } from "pg";

interface BunnyVideo {
  guid: string;
  title: string;
  fileName?: string;
  name?: string;
}

function extractIdFromTitle(title: string): number | null {
  // Match patterns like "20758.mp4", "20758", "video_20758.mp4", etc.
  const match = title.match(/(\d+)/);
  if (!match) return null;
  const id = parseInt(match[1], 10);
  return isNaN(id) ? null : id;
}

async function fetchAllVideos(
  apiKey: string,
  libraryId: string,
): Promise<BunnyVideo[]> {
  const videos: BunnyVideo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos?page=${page}&itemsPerPage=${perPage}`,
      { headers: { AccessKey: apiKey } },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { Message?: string; message?: string };
      throw new Error(
        `Bunny API error: ${res.status} - ${err.Message || err.message || "unknown"}`,
      );
    }

    const data = await res.json() as { items?: BunnyVideo[] };
    const items: BunnyVideo[] = data.items || [];

    if (items.length === 0) break;

    videos.push(...items);

    if (items.length < perPage) break;
    page++;
  }

  return videos;
}

async function syncBunnyGuids(): Promise<void> {
  const apiKey = process.env.BUNNY_API_KEY;
  const libraryId = process.env.BUNNY_LIBRARY_ID || "670590";

  if (!apiKey) {
    console.error("❌ BUNNY_API_KEY não definida. Configure a variável de ambiente.");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não definida. Configure a variável de ambiente.");
    process.exit(1);
  }

  console.log(`🔍 Buscando vídeos da biblioteca ${libraryId}...`);

  const videos = await fetchAllVideos(apiKey, libraryId);
  console.log(`📹 ${videos.length} vídeo(s) encontrado(s) no Bunny Stream`);

  if (videos.length === 0) {
    console.log("⚠️ Nenhum vídeo encontrado. Nada a sincronizar.");
    process.exit(0);
  }

  // Build mapping: id → guid
  const mapping: Map<number, string> = new Map();
  const unmatched: BunnyVideo[] = [];

  for (const v of videos) {
    const id = extractIdFromTitle(v.title);
    if (id !== null) {
      mapping.set(id, v.guid);
    } else {
      unmatched.push(v);
    }
  }

  console.log(`🔗 ${mapping.size} vídeo(s) com ID reconhecível`);
  if (unmatched.length > 0) {
    console.log(`⚠️ ${unmatched.length} vídeo(s) com título não reconhecido:`);
    for (const u of unmatched) {
      console.log(`   - "${u.title}" (GUID: ${u.guid})`);
    }
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    let updated = 0;
    let notFound = 0;

    for (const [id, guid] of mapping) {
      const result = await pool.query(
        `UPDATE musicas SET bunny_guid = $1 WHERE id = $2 RETURNING id, artista, musica`,
        [guid, id],
      );

      if (result.rowCount && result.rowCount > 0) {
        const row = result.rows[0];
        console.log(
          `   ✅ ID ${id} → ${row.artista} — ${row.musica} | GUID: ${guid}`,
        );
        updated++;
      } else {
        console.log(`   ❌ ID ${id} não encontrado no banco de dados`);
        notFound++;
      }
    }

    console.log("\n═══════════════════════════════════════");
    console.log("✅ Sincronização concluída!");
    console.log(`   🔄 Atualizados: ${updated} músicas`);
    console.log(`   ❌ Não encontradas: ${notFound} IDs`);
    console.log("═══════════════════════════════════════");
  } finally {
    await pool.end();
  }
}

syncBunnyGuids().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
