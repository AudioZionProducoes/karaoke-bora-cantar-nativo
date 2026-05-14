/**
 * Script de importação do arquivo Dados_CT.ini para a tabela 'musicas' no PostgreSQL.
 *
 * Uso:
 *   pnpm --filter @workspace/scripts run import-musicas -- --file /caminho/para/Dados_CT.ini
 *
 * O arquivo pode estar em codificação Latin-1 (ISO-8859-1) ou UTF-8.
 * O script detecta automaticamente e converte se necessário.
 */

import fs from "fs";
import path from "path";
import { Pool } from "pg";

const BATCH_SIZE = 500;

interface Musica {
  id: number;
  artista: string;
  musica: string;
  inicio: string | null;
}

function parseIniFile(content: string): Musica[] {
  const musicas: Musica[] = [];
  const lines = content.split(/\r?\n/);

  let currentId: number | null = null;
  let currentArtista: string | null = null;
  let currentMusica: string | null = null;
  let currentInicio: string | null = null;

  function flush() {
    if (currentId !== null && currentArtista && currentMusica) {
      musicas.push({
        id: currentId,
        artista: currentArtista.trim(),
        musica: currentMusica.trim(),
        inicio: currentInicio?.trim() || null,
      });
    }
    currentId = null;
    currentArtista = null;
    currentMusica = null;
    currentInicio = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Section header: [ID]
    const sectionMatch = line.match(/^\[(\d+)\]$/);
    if (sectionMatch) {
      flush();
      currentId = parseInt(sectionMatch[1], 10);
      continue;
    }

    if (currentId === null) continue;

    // Key=Value pairs
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;

    const key = line.slice(0, eqIdx).trim().toLowerCase();
    const value = line.slice(eqIdx + 1).trim();

    if (key === "artista") currentArtista = value;
    else if (key === "musica") currentMusica = value;
    else if (key === "inicio") currentInicio = value || null;
  }

  flush();
  return musicas;
}

async function readFileWithEncoding(filePath: string): Promise<string> {
  // Try UTF-8 first, fall back to Latin-1
  try {
    const buf = fs.readFileSync(filePath);
    // Check for common Latin-1 indicators (bytes > 0x7F)
    const hasHighBytes = buf.some((b) => b > 0x7f);
    if (hasHighBytes) {
      // Decode as Latin-1
      return buf.toString("latin1");
    }
    return buf.toString("utf8");
  } catch (err) {
    throw new Error(`Erro ao ler o arquivo: ${err}`);
  }
}

async function importMusicas(filePath: string): Promise<void> {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Arquivo não encontrado: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`📂 Lendo arquivo: ${resolvedPath}`);
  const content = await readFileWithEncoding(resolvedPath);

  console.log("🎵 Analisando músicas...");
  const musicas = parseIniFile(content);
  console.log(`✅ ${musicas.length} músicas encontradas no arquivo`);

  if (musicas.length === 0) {
    console.error("❌ Nenhuma música encontrada. Verifique o formato do arquivo.");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não definida. Configure a variável de ambiente.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS musicas (
        id INTEGER PRIMARY KEY,
        artista TEXT NOT NULL,
        musica TEXT NOT NULL,
        inicio TEXT
      )
    `);

    console.log("🚀 Importando para o banco de dados em lotes de", BATCH_SIZE, "músicas...");

    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < musicas.length; i += BATCH_SIZE) {
      const batch = musicas.slice(i, i + BATCH_SIZE);

      const values = batch
        .map((_, idx) => {
          const base = idx * 4;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
        })
        .join(", ");

      const params = batch.flatMap((m) => [m.id, m.artista, m.musica, m.inicio]);

      const result = await pool.query(
        `INSERT INTO musicas (id, artista, musica, inicio)
         VALUES ${values}
         ON CONFLICT (id) DO NOTHING`,
        params,
      );

      imported += result.rowCount ?? 0;
      skipped += batch.length - (result.rowCount ?? 0);

      const progress = Math.min(i + BATCH_SIZE, musicas.length);
      const pct = ((progress / musicas.length) * 100).toFixed(1);
      process.stdout.write(`\r   Progresso: ${progress}/${musicas.length} (${pct}%)`);
    }

    console.log("\n");
    console.log("═══════════════════════════════════════");
    console.log(`✅ Importação concluída!`);
    console.log(`   📀 Inseridas: ${imported} músicas`);
    console.log(`   ⏭️  Ignoradas (já existiam): ${skipped} músicas`);
    console.log(`   📊 Total no catálogo: ${musicas.length} músicas`);
    console.log("═══════════════════════════════════════");
  } finally {
    await pool.end();
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const fileArgIdx = args.indexOf("--file");
const filePath = fileArgIdx !== -1 ? args[fileArgIdx + 1] : args[0];

if (!filePath) {
  console.error("Uso: pnpm --filter @workspace/scripts run import-musicas -- --file /caminho/para/Dados_CT.ini");
  process.exit(1);
}

importMusicas(filePath).catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
