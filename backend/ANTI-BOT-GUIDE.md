# Guia Anti-Detecção de Bot para YouTube

O YouTube implementou detecções avançadas para identificar e bloquear bots. Este guia explica como contornar essas limitações.

## 🚫 Problema: "Sign in to confirm you're not a bot"

Este erro indica que o YouTube detectou uso automatizado. O XandTube agora implementa múltiplas estratégias para contornar isso.

## 🛡️ Estratégias Implementadas

### 1. **Headers de Navegador Real**
- User-Agent do Chrome mais recente
- Headers Accept padrão do navegador
- Headers de idioma e encoding
- Flags DNT (Do Not Track)

### 2. **Múltiplas Fontes de Cookies**
O sistema tenta automaticamente na seguinte ordem:
1. 🍪 **Arquivo cookies.txt** (se existir)
2. 🌐 **Chrome browser cookies** (`--cookies-from-browser chrome`)
3. 🦊 **Firefox browser cookies** (`--cookies-from-browser firefox`)
4. 🔷 **Edge browser cookies** (`--cookies-from-browser edge`)
5. 🛡️ **Apenas headers anti-detecção**
6. 📝 **Comando básico** (último recurso)

### 3. **Rate Limiting Inteligente**
- Delay de 1-3 segundos entre requisições
- Delay de 5 segundos ao detectar bloqueio de bot
- Timeouts apropriados para evitar travamentos

## 📋 Métodos de Configuração

### Opção 1: Cookies do Navegador (Automático)
**Mais Fácil** - O yt-dlp extrai cookies automaticamente:

1. Faça login no YouTube em qualquer navegador
2. O sistema tentará usar os cookies automaticamente
3. Funciona com Chrome, Firefox e Edge

### Opção 2: Arquivo cookies.txt (Manual)
**Mais Confiável** - Controle total sobre os cookies:

1. Instale extensão "Get cookies.txt LOCALLY"
2. Vá para youtube.com e faça login
3. Exporte cookies como `cookies.txt`
4. Coloque na pasta `backend/`

## 🔧 Solução de Problemas

### Se continuar com erro de bot:

1. **Limpe cookies do navegador**:
   ```bash
   # Chrome (Windows)
   %LOCALAPPDATA%\Google\Chrome\User Data\Default\Cookies
   
   # Firefox (Windows)  
   %APPDATA%\Mozilla\Firefox\Profiles\[profile]\cookies.sqlite
   ```

2. **Faça novo login no YouTube**:
   - Use um navegador "limpo"
   - Faça login normalmente
   - Navegue alguns vídeos manualmente
   - Então tente novamente

3. **Use VPN se necessário**:
   - Alguns IPs podem estar temporariamente bloqueados
   - Troque para outra região/servidor

4. **Aguarde alguns minutos**:
   - O bloqueio pode ser temporário
   - O sistema implementa delays automáticos

## 📊 Logs do Sistema

O sistema agora fornece logs detalhados:

```
🔄 Tentativa: Chrome browser cookies + Anti-detection
✅ Sucesso com: Chrome browser cookies + Anti-detection
```

ou

```
❌ Chrome browser cookies + Anti-detection falhou: ERROR: Sign in to confirm...
🤖 Detecção de bot detectada, aguardando 5 segundos...
🔄 Tentativa: Firefox browser cookies + Anti-detection
```

## 🎯 Dicas Avançadas

### Para máxima eficácia:

1. **Use conta real do YouTube**:
   - Contas novas/vazias são mais suspeitas
   - Tenha histórico de visualizações

2. **Mantenha sessão ativa**:
   - Deixe YouTube aberto no navegador
   - Use regularmente de forma manual

3. **Evite uso excessivo**:
   - Não faça muitas requisições seguidas
   - Espaçe downloads ao longo do tempo

4. **Atualize cookies regularmente**:
   - Cookies expiram (geralmente 1-2 semanas)
   - Renove quando começar a falhar

## 🔄 Funcionamento Automático

O sistema agora é **totalmente automático**:
- ✅ Detecta e usa cookies automaticamente
- ✅ Tenta múltiplos métodos em sequência  
- ✅ Implementa delays inteligentes
- ✅ Logs detalhados para debug
- ✅ Fallbacks robustos

**Não precisa configurar nada manualmente** - o sistema tentará todos os métodos disponíveis até encontrar um que funcione!
