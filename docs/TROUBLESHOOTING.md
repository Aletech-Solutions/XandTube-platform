# XandTube - Solução de Problemas

## 🚨 Problemas Comuns

### 1. Erro "Cannot read properties of undefined" ✅ CORRIGIDO

**Status:** RESOLVIDO na versão 2.1

**Sintomas:**
- Erro ao tentar obter informações de vídeos/playlists
- Mensagem: `Cannot read properties of undefined (reading '_type')`
- YT-DLP comando direto funciona, mas serviço falha
- Erro de referência durante download: `Cannot access 'result' before initialization`

**Causa Identificada:**
1. A biblioteca `youtube-dl-exec` não estava funcionando corretamente no Windows
2. Erro de escopo no callback de progresso tentando acessar `result` antes da inicialização

**Solução Implementada:**
✅ Substituído `youtube-dl-exec` por comandos diretos `yt-dlp`
✅ Uso de `child_process.exec` para execução direta
✅ Melhor tratamento de erros e parsing JSON
✅ Fallback automático para diferentes parâmetros
✅ **NOVO:** Correção do erro de referência no callback de progresso
✅ **NOVO:** Metadados obtidos antes do download para evitar problemas de escopo

**Diagnóstico:**
1. Verifique se o YT-DLP está instalado:
   ```bash
   yt-dlp --version
   ```

2. Teste rápido da correção:
   ```bash
   cd backend
   npm run test:download
   ```

3. Teste específico do fix de referência:
   ```bash
   cd backend
   npm run test:fix
   ```

4. Teste o endpoint de debug:
   ```bash
   curl "http://localhost:3001/api/download/test?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

**Verificação da Correção:**
- ✅ Logs mostram "🚀 Usando comando direto yt-dlp..."
- ✅ Não há mais dependência `youtube-dl-exec`
- ✅ Teste `npm run test:download` passa
- ✅ **NOVO:** Teste `npm run test:fix` passa sem erros de referência
- ✅ **NOVO:** Download funciona com progresso em tempo real

**Se Ainda Houver Problemas:**

#### Opção 1: Reinstalar YT-DLP
```bash
# Desinstalar versão antiga
pip uninstall youtube-dl yt-dlp

# Instalar versão mais recente
pip install --upgrade yt-dlp
```

#### Opção 2: Verificar PATH
```bash
# Windows
where yt-dlp

# Linux/macOS
which yt-dlp
```

### 2. Problemas com Playlists Específicas

**Sintomas:**
- Vídeos únicos funcionam, mas playlists falham
- Playlist retorna 0 vídeos

**Diagnóstico:**
1. Teste a playlist diretamente:
   ```bash
   yt-dlp --dump-json "URL_DA_PLAYLIST"
   ```

2. Verifique se a playlist é pública:
   - Playlists privadas/não listadas podem não funcionar
   - Algumas playlists têm restrições regionais

**Soluções:**
- Use playlists públicas para teste
- Tente com `--flat-playlist` se disponível
- Verifique se a URL está correta

### 3. Erro de CORS no Frontend

**Sintomas:**
- Erro CORS no navegador
- Requisições bloqueadas

**Solução:**
O CRACO já está configurado. Se ainda houver problemas:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### 4. Token JWT Expirado

**Sintomas:**
- Erro 401 nas requisições
- Redirecionamento automático para login

**Solução:**
- Faça logout e login novamente
- Tokens expiram após 7 dias

### 5. YT-DLP Versão Incompatível

**Sintomas:**
- Alguns vídeos/playlists não funcionam
- Erros de parsing

**Solução:**
```bash
# Atualizar YT-DLP
pip install --upgrade yt-dlp

# Verificar versão (deve ser >= 2023.01.06)
yt-dlp --version
```

## 🛠️ Ferramentas de Debug

### 1. Endpoint de Teste
```bash
GET /api/download/test?url=URL_DO_VIDEO
```

Retorna:
```json
{
  "success": true,
  "message": "YT-DLP funcionando corretamente",
  "directTest": {
    "type": "video",
    "title": "Título do vídeo",
    "hasEntries": false,
    "entriesCount": 0
  }
}
```

### 2. Logs Detalhados

No console do backend, procure por:
- 🔍 Mensagens de início de processamento
- ✅ Sucessos do YT-DLP
- ❌ Erros detalhados
- 📊 Informações dos vídeos/playlists

### 3. Teste Manual do YT-DLP

```bash
# Teste básico
yt-dlp --dump-json "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Teste de playlist
yt-dlp --dump-json --flat-playlist "https://www.youtube.com/playlist?list=PLExamplePlaylist"
```

## 🔧 URLs de Teste Conhecidas

### Vídeos Funcionais:
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ` (Rick Roll)
- `https://www.youtube.com/watch?v=jNQXAC9IVRw` (Me at the zoo)

### Playlists Funcionais:
- `https://www.youtube.com/playlist?list=PLrJM4_ZQmJVC7VpIpGOmQANQMeFnR2dQ8`

## 📝 Coletando Logs para Suporte

1. **Ativar logs detalhados:**
   ```bash
   cd backend
   DEBUG=* npm run dev
   ```

2. **Reproduzir o erro**

3. **Coletar informações:**
   - Versão do Node.js: `node --version`
   - Versão do YT-DLP: `yt-dlp --version`
   - Sistema operacional
   - URL que está causando problema
   - Logs completos do erro

## 🚀 Reinstalação Completa

Se nada funcionar, reinstale completamente:

```bash
# 1. Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# 2. Frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install

# 3. YT-DLP
pip uninstall yt-dlp
pip install --upgrade yt-dlp

# 4. Verificar instalação
yt-dlp --version
```

## 📞 Ainda Com Problemas?

1. Verifique os logs do console
2. Use o endpoint `/api/download/test` para diagnóstico
3. Teste o YT-DLP manualmente
4. Verifique se a URL do vídeo/playlist é pública
5. Consulte a documentação oficial do YT-DLP

## 🔄 Atualizações Frequentes

O YouTube muda frequentemente sua API. Para manter compatibilidade:

```bash
# Atualize o YT-DLP semanalmente
pip install --upgrade yt-dlp
```