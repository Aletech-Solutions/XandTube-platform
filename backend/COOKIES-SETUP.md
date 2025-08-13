# Configuração de Cookies para YT-DLP

Para evitar banimentos e limitações do YouTube, você pode configurar cookies de uma sessão autenticada.

## Como obter e configurar cookies

### 1. Instalar extensão do navegador
Instale a extensão "Get cookies.txt LOCALLY" ou similar:
- **Chrome/Edge**: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
- **Firefox**: [cookies.txt](https://addons.mozilla.org/firefox/addon/cookies-txt/)

### 2. Obter cookies do YouTube
1. Vá para [youtube.com](https://youtube.com)
2. Faça login na sua conta do Google/YouTube
3. Clique na extensão de cookies
4. Selecione "Export" ou "Download" para salvar como cookies.txt

### 3. Configurar no XandTube
1. Salve o arquivo como `cookies.txt` na pasta `backend/`
2. Reinicie o servidor backend
3. Verifique nos logs se aparece: "🍪 Arquivo de cookies encontrado"

## Formato do arquivo cookies.txt

O arquivo deve estar no formato Netscape HTTP Cookie File:

```
# Netscape HTTP Cookie File
.youtube.com	TRUE	/	FALSE	1234567890	session_token	seu_token_aqui
.google.com	TRUE	/	FALSE	1234567890	__Secure-3PSID	seu_sid_aqui
```

## Benefícios dos cookies

✅ **Evita banimentos** por uso excessivo  
✅ **Acesso a vídeos privados** (se tiver permissão)  
✅ **Melhor estabilidade** em downloads  
✅ **Acesso a conteúdo restrito** por região  

## Segurança

⚠️ **IMPORTANTE**: 
- Mantenha o arquivo `cookies.txt` privado e seguro
- Nunca compartilhe seus cookies
- Os cookies podem expirar (renove periodicamente)
- Adicione `cookies.txt` ao `.gitignore` se usando controle de versão

## Solução de problemas

### Cookies não funcionando
1. Verifique se o arquivo está no formato correto
2. Confirme que está logado no YouTube
3. Renovação dos cookies (eles podem expirar)
4. Verifique permissões do arquivo

### Logs para debug
O sistema mostra nos logs:
- `🍪 Arquivo de cookies encontrado` - cookies carregados
- `⚠️ Arquivo de cookies não encontrado` - precisa configurar
- `🍪 Usando cookies para evitar banimentos` - em uso durante downloads
