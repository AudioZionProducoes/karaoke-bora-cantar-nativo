# Guia Bunny Stream - Karaoke CT

## Objetivo
Configurar a integracao entre o app Karaoke CT e a Bunny.net para sincronizacao automatica de videos disponiveis.

---

## Passo 1: Criar conta na Bunny.net

1. Acesse: https://bunny.net
2. Clique em "Sign Up" ou "Get Started"
3. Preencha seu email e senha
4. Confirme o email (verifique sua caixa de entrada)
5. Complete os dados de cobranca (cartao ou PayPal)

---

## Passo 2: Criar uma Video Library

1. No dashboard da Bunny, clique em **Stream** no menu lateral
2. Clique em **Add New Library**
3. Escolha um nome: `Karaoke CT`
4. Selecione a regiao mais proxima do Brasil (Sao Paulo se disponivel, ou Miami)
5. Clique em **Add Library**

---

## Passo 3: Encontrar o Library ID

1. Com a library criada, clique nela para abrir
2. No painel da library, procure por **Library ID** ou **GUID**
3. E um numero/UUID que aparece no topo da pagina
4. Anote esse valor - sera o **BUNNY_LIBRARY_ID**

**Exemplo:** `123456` ou `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## Passo 4: Gerar a API Key

1. No dashboard da Bunny, va em **Account** (icone do usuario no topo direito)
2. Clique em **API**
3. Clique em **Add API Key** ou **Generate API Key**
4. De um nome: `Karaoke CT Sync`
5. **Importante:** Em permissoes, marque:
   - Read (leitura) - para listar os videos
   - Opcional: Write se quiser fazer upload via API
6. Clique em **Generate**
7. **Copie a chave imediatamente** - ela so aparece uma vez!

**Exemplo:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## Passo 5: Fazer upload dos videos

### Opcao A: Upload manual (recomendado para poucos videos)
1. Dentro da Video Library, clique em **Upload**
2. Arraste ou selecione os arquivos `.mp4`
3. **Importante:** O nome do arquivo deve ser apenas o numero do ID da musica
   - Exemplo: se a musica no Dados_CT.ini tem ID `12345`, o arquivo deve se chamar `12345.mp4`
   - ERRADO: `Jorge Mateus - Amo Noite e Dia.mp4`
   - CERTO: `12345.mp4`

### Opcao B: Upload em massa
1. Clique em **Upload** → **Folder Upload**
2. Selecione a pasta com todos os `.mp4`
3. Certifique-se de que todos os arquivos seguem a nomenclatura `ID.mp4`

---

## Passo 6: Configurar no Replit

### 6.1 Configurar BUNNY_LIBRARY_ID (para o player funcionar)
1. No Replit, va em **Secrets** (icone de chave no lado direito)
2. Adicione uma nova secret:
   - Nome: `VITE_BUNNY_LIBRARY_ID`
   - Valor: o Library ID que voce anotou no Passo 3
3. Salve

### 6.2 Configurar BUNNY_API_KEY (para sincronizacao)
1. No Replit, va em **Secrets** do artifact `api-server`
2. Adicione duas novas secrets:
   - Nome: `BUNNY_LIBRARY_ID`
     Valor: o mesmo Library ID do passo 3
   - Nome: `BUNNY_API_KEY`
     Valor: a API Key que voce gerou no Passo 4
3. Salve ambas

---

## Passo 7: Sincronizar no painel Admin

1. Abra o app Karaoke CT
2. Va em **Admin** (canto superior direito)
3. Na aba **Catalogo**, clique no botao **Sincronizar Bunny**
4. Aguarde a mensagem de confirmacao:
   - "Sincronizado com Bunny Stream: X de Y videos correspondem ao catalogo"
5. Pronto! As musicas agora aparecem na busca do cliente

---

## Resumo das variaveis necessarias

| Variavel | Valor | Para que serve |
|---|---|---|
| VITE_BUNNY_LIBRARY_ID | ID da library | Player mostrar os videos |
| BUNNY_LIBRARY_ID | ID da library | API ler lista de videos |
| BUNNY_API_KEY | Chave da API | Autorizar a sincronizacao |

---

## Como funciona a sincronizacao

Quando voce clica em **Sincronizar Bunny**:
1. O app busca TODOS os videos na sua library Bunny
2. Extrai os IDs numericos dos nomes dos arquivos (`12345.mp4` -> `12345`)
3. Marca no banco de dados quais musicas tem video
4. So as musicas com video aparecem na busca do cliente

Isso evita que o cliente escolha uma musica que nao tem video disponivel!

---

## Troubleshooting

| Problema | Solucao |
|---|---|
| "Erro na sincronizacao - credenciais nao configuradas" | Verifique se BUNNY_API_KEY e BUNNY_LIBRARY_ID estao nas secrets do api-server |
| "0 videos correspondem ao catalogo" | Verifique se os arquivos .mp4 na Bunny tem os nomes corretos (apenas o numero do ID) |
| Musica nao aparece na busca | Verifique se o ID do Dados_CT.ini e o mesmo do nome do arquivo .mp4 |
| Video nao carrega no player | Verifique se VITE_BUNNY_LIBRARY_ID esta configurado |

---

## Contato
Duvidas? Entre em contato pelo suporte do Karaoke CT.
