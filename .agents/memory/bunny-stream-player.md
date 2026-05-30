---
name: Bunny Stream Player API
description: Detalhes da API postMessage do player Bunny Stream para detectar fim de vídeo
---

## Formato dos eventos

O player Bunny Stream (baseado em Video.js) emite eventos via `window.postMessage` com esta estrutura:

```js
{ event: "timeupdate", seconds: 23.5, duration: 180.5 }  // campo é "seconds", não "currentTime"
{ event: "ended" }
{ event: "pause", seconds: X, duration: Y }
{ event: "play" }
```

**Why:** A versão antiga usava `currentTime` que nunca era preenchido — o handler de timeupdate nunca detectava o fim.

## Comandos enviáveis ao player

```js
iframe.contentWindow.postMessage({ method: "getCurrentTime" }, "*")
// Resposta: { method: "getCurrentTime", value: 23.5 }

iframe.contentWindow.postMessage({ method: "getDuration" }, "*")
// Resposta: { method: "getDuration", value: 180.5 }
```

## How to apply

Sempre checar `e.data.seconds ?? e.data.currentTime ?? e.data.time` para compatibilidade.
Implementar polling ativo com `getCurrentTime` a cada 1s como fallback quando eventos espontâneos não chegam.
Verificar `e.data.event ?? e.data.method ?? e.data.type` para capturar todas as variações de formato.
