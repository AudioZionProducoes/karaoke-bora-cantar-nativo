import { useState } from "react";

const TEST_GUIDS = [
  { label: "20759 - Out Of Touch", guid: "9efbd353-821e-4c22-9e00-0bd1689a3533" },
  { label: "20758 - Mr. Vain", guid: "14bdf2a4-1334-483d-9563-c050a4368223" },
  { label: "20760 - Up All Night", guid: "4ad43daa-643a-4634-b439-555719c2f556" },
];

const LIBRARY_ID = "670590";

export default function VideoTestPage() {
  const [selected, setSelected] = useState(TEST_GUIDS[0]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Vídeo</h1>
      <p className="text-white/50 text-sm mb-4">
        Vídeos convertidos de AC3 → AAC. O iframe abaixo usa o player nativo do Bunny Stream.
      </p>

      <div className="mb-4 flex gap-2 flex-wrap">
        {TEST_GUIDS.map((t) => (
          <button
            key={t.guid}
            onClick={() => setSelected(t)}
            className={`px-4 py-2 rounded-lg text-sm ${
              selected.guid === t.guid
                ? "bg-primary text-black font-bold"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-2 text-sm text-white/60">
        GUID: <code className="text-primary">{selected.guid}</code>
      </div>

      <div className="w-full max-w-4xl aspect-video bg-black border border-white/20 rounded-lg overflow-hidden">
        <iframe
          key={selected.guid}
          src={`https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${selected.guid}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`}
          className="w-full h-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="Teste de vídeo"
        />
      </div>

      <div className="mt-8">
        <a href="/tv/5NADUJ" className="text-primary underline">Voltar para TV</a>
      </div>
    </div>
  );
}
