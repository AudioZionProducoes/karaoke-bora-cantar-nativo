# Player.tsx — Documentacao Comentada (Karaoke CT)

## Visao Geral

O componente `Player` e a tela principal de reproducao de musicas do Karaoke CT.
Ele combina um player de video (Bunny Stream ou arquivos locais), uma barra de busca
para adicionar musicas a fila, uma tela de pontuacao (karaoke score), um painel de
fila de espera e um QR Code para controle remoto via celular.

---

## Dependencias

```typescript
// React e hooks
import { useState, useCallback, useMemo, useEffect, useRef } from "react";

// Roteamento (wouter — leve alternativa ao React Router)
import { useParams, Link, useLocation } from "wouter";

// Icones (Lucide React)
import {
  ArrowLeft, Play, Music, AlertCircle, FolderOpen,
  Star, RotateCcw, Trophy, Search, X, Mic2,
  ListMusic, Trash2, ListPlus, Check, UserRound, ChevronRight,
  Smartphone
} from "lucide-react";

// Hooks e utilitarios do projeto
import { useDebounce } from "@/hooks/use-debounce";           // Atraso na digitacao
import { useToast } from "@/hooks/use-toast";                   // Notificacoes toast
import { useLocalMusic } from "@/contexts/local-music-context"; // Musica local (pasta)
import { useQueue, type QueueItem } from "@/contexts/queue-context"; // Fila de musicas
import { useSession } from "@/hooks/use-session";               // Sessao compartilhada

// Componentes UI (shadcn/ui)
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// API gerada pelo Orval (OpenAPI -> React Query)
import {
  useGetMusica, getGetMusicaQueryKey, useSearchMusicas
} from "@workspace/api-client-react";

// Dialog para adicionar a fila (nome do cantor)
import { AddToQueueDialog, type PendingQueueItem } from "@/components/add-to-queue-dialog";

// Biblioteca de QR Code
import QRCodeLib from "react-qr-code";
```

---

## Funcoes Utilitarias

### `randomScore()`

```typescript
function randomScore(): number {
  return Math.floor(Math.random() * 21) + 80;
}
```

**Objetivo:** Gerar uma pontuacao aleatoria entre 80 e 100.

**Explicacao:**
- `Math.random()` gera um numero entre 0 e 0.999...
- Multiplicamos por 21 (0 a 20.999)
- `Math.floor()` arredonda para baixo (0 a 20)
- Somamos 80 (resultado final: 80 a 100)

---

## Componente: `PersistentSearchBar`

### Resumo

Barra de busca fixa no header do player. Permite buscar musicas por artista, titulo ou
codigo e adiciona-las diretamente a fila de espera ou toca-las imediatamente.

### Estados

| Estado          | Tipo                        | Descricao                                      |
|-----------------|-----------------------------|------------------------------------------------|
| `searchTerm`    | `string`                    | Texto digitado pelo usuario                     |
| `page`          | `number`                    | Pagina atual dos resultados (paginacao)         |
| `focused`       | `boolean`                   | Se o campo esta focado (mostra dropdown)       |
| `pendingItem`   | `PendingQueueItem \| null`  | Musica aguardando nome do cantor               |

### Funcionamento

1. **Digitacao do usuario** -> `searchTerm` e atualizado a cada keystroke
2. **Debounce de 300ms** -> A busca na API so acontece depois de 300ms sem digitacao
3. **Foco no campo** -> Ativa `focused = true` e carrega resultados da API
4. **Clique fora** -> Fecha o dropdown via listener de `mousedown` no documento
5. **Tecla Escape** -> Limpa a busca e fecha o dropdown

### Adicionar a Fila

```
Usuario clica em "+" (ListPlus) na musica
  -> openQueueDialog() verifica se a fila nao esta cheia (max 30)
  -> Verifica se a musica ja nao esta na fila
  -> Abre o AddToQueueDialog pedindo o nome do cantor
  -> Usuario digita o nome e confirma
  -> handleConfirmQueue() adiciona a fila via addToQueue()
  -> Toast de confirmacao aparece
```

### Tocar Imediatamente

```
Usuario clica em "Tocar" (Play)
  -> Navega para /player/{id}
  -> Limpa a busca e fecha o dropdown
```

---

## Componente: `ScoreScreen`

### Resumo

Tela de pontuacao que aparece apos a musica terminar. Mostra a pontuacao do cantor,
estrelas, rotulo (Perfeito!/Incrivel!/etc.) e a proxima musica na fila.

### Logica de Pontuacao

| Pontuacao | Estrelas | Rotulo       |
|-----------|----------|--------------|
| 100       | 5        | Perfeito!    |
| 95-99     | 5        | Incrivel!    |
| 90-94     | 4        | Excelente!   |
| 85-89     | 3        | Muito Bom!   |
| 80-84     | 2        | Bom trabalho!|

### Grafico Circular (SVG)

Usa SVG para desenhar um circulo com stroke-dasharray/stroke-dashoffset para
representar visualmente a pontuacao como um arco de progresso.

### Teclado

Pressionar **Enter** avanca automaticamente para a proxima musica da fila (se houver).

---

## Componente: `SearchTopPanel`

### Resumo

Painel de busca que desliza do topo da tela. Funciona como uma busca em tela cheia
quando ativado (atualmente nao e usado no layout atual, pois a busca e persistente
no header).

---

## Componente: `QueuePanel`

### Resumo

Painel que mostra a fila de musicas na ordem de execucao. Permite:
- Ver todas as musicas na fila (maximo 30)
- Remover uma musica individualmente
- Limpar toda a fila de uma vez

### Estrutura de cada item da fila

```
[Posicao] [Icone cantor] [Nome do cantor]
                            [Musica — Artista]
                            [Codigo #id]     [X remover]
```

---

## Componente Principal: `Player` (export default)

### Estados Principais

| Estado           | Tipo                         | Descricao                                 |
|------------------|------------------------------|---------------------------------------------|
| `score`          | `number \| null`            | Pontuacao atual (null = nao mostrar)        |
| `videoKey`       | `number`                     | Chave para forcar recarregamento do video   |
| `panel`          | `"none" \| "search" \| "queue"` | Painel ativo (fila ou busca)               |
| `sessionId`      | `string \| null`             | ID da sessao compartilhada                  |
| `nextQueuedItem` | `QueueItem \| null`          | Proxima musica (para tela de pontuacao)     |

### Ciclo de Vida

#### 1. Montagem (useEffect)

```
Ao abrir o player:
  1. Tenta reutilizar sessao salva no localStorage
  2. Se nao existir ou for invalida, cria uma nova sessao
  3. A sessao permite que celulares controlem a fila via /remote/{id}
```

#### 2. Fim do Video (handleVideoEnd)

```
Quando o video termina:
  1. Captura o proximo item da fila (sem remove-lo ainda)
  2. Gera uma pontuacao aleatoria
  3. Mostra a tela de pontuacao (ScoreScreen)
```

#### 3. Proxima Musica (handleNext)

```
Quando usuario clica "Comecar" ou pressiona Enter:
  1. Remove a primeira musica da fila (shiftQueue)
  2. Incrementa videoKey (forca recarregamento do player)
  3. Navega para /player/{id_da_proxima_musica}
```

#### 4. Repetir (handleReplay)

```
Quando usuario clica "Cantar de novo":
  1. Limpa a pontuacao
  2. Incrementa videoKey (reinicia o video atual)
```

### Renderizacao do Video

O player tenta reproduzir a musica em 3 modos, em ordem de prioridade:

1. **Bunny Stream** (streaming online)
   - Requer `VITE_BUNNY_LIBRARY_ID` configurado
   - Usa iframe do Bunny Stream com autoplay

2. **Arquivo Local** (modo offline)
   - Usa `useLocalMusic()` para acessar pasta de MP4
   - Usa tag `<video>` nativa do HTML5

3. **Tela de erro**
   - Mostra mensagem se o arquivo nao for encontrado
   - Permite selecionar a pasta de musicas

### QR Code (Controle Remoto)

```
Sessao criada automaticamente ao abrir o player
  -> Gera URL: {origem}/remote/{sessionId}
  -> Renderiza QR Code no canto inferior direito do video
  -> Usuario escaneia com celular
  -> Celular abre interface /remote/{id} para adicionar musicas
```

O QR Code fica sempre visivel durante a reproducao, com fundo amarelo/primary
translucido (`bg-primary/80`) para contrastar com o video.

---

## Integracao com Contextos

### `useQueue` (Fila Local)

- `queue`: Array de musicas na fila (max 30)
- `addToQueue()`: Adiciona musica ao final da fila
- `removeFromQueue()`: Remove musica por ID
- `shiftQueue()`: Remove e retorna a primeira musica
- `clearQueue()`: Limpa toda a fila
- `isInQueue()`: Verifica se musica ja esta na fila

### `useSession` (Sessao Compartilhada)

- `createSession()`: Cria nova sessao com ID aleatorio
- `joinSession()`: Entra em sessao existente
- Permite que multiplos dispositivos sincronizem a mesma fila

### `useLocalMusic` (Arquivos Locais)

- `folderName`: Nome da pasta selecionada
- `selectFolder()`: Abre dialog para escolher pasta
- `getFileUrl()`: Retorna URL do arquivo MP4 pelo ID

---

## Fluxo Completo de Uso

```
1. Usuario busca musica na barra de busca do header
2. Clica "+" para adicionar a fila
3. Digita o nome do cantor no dialog
4. Musica aparece na fila (painel "Fila")
5. Toca a musica atual (video em tela cheia)
6. Ao terminar, aparece tela de pontuacao
7. Opcional: clicar "Comecar" para proxima da fila
8. Outros podem adicionar musicas via QR Code no celular
```

---

## Arquitetura de Componentes

```
Player (pagina principal)
├── Header
│   ├── Botao Voltar
│   ├── Titulo da musica (escondido em mobile)
│   ├── PersistentSearchBar
│   │   ├── Campo de busca
│   │   ├── Dropdown de resultados
│   │   └── AddToQueueDialog (modal nome do cantor)
│   ├── Botao Pontuacao
│   └── Botao Fila (com contador)
├── QueuePanel (condicional)
│   └── Lista de musicas na fila
├── Video Area
│   ├── Player Bunny Stream (iframe)
│   ├── Player Local (video tag)
│   ├── ScoreScreen (overlay)
│   └── QR Code (canto inferior direito)
└── Gradient bottom (decorativo)
```

---

## Consideracoes Tecnicas

- **Stale closures:** Usa `useRef` para guardar referencias atualizadas de `shiftQueue`
  e `navigate`, evitando problemas com closures em callbacks memorizados.

- **SSR-safe:** `typeof window !== "undefined"` antes de acessar `window.location`
  para evitar erros em server-side rendering.

- **Debounced search:** 300ms de debounce para evitar requisicoes excessivas a API
  enquanto o usuario digita.

- **Click-outside:** Listener de `mousedown` no documento para fechar o dropdown de
  busca ao clicar fora, sem depender do `onBlur` que quebrava cliques nos botoes.
