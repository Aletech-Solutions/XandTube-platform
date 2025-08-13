# Componentes de Avatar e Banner

Este documento descreve os novos componentes criados para melhorar a experiência visual com imagens de fallback.

## 🎨 Avatar Component

Componente reutilizável para avatares com fallback automático usando gradientes coloridos.

### Uso

```jsx
import Avatar from '../components/Avatar';

<Avatar
  src="/path/to/image.jpg"
  name="Nome do Canal"
  size={120}
  border={true}
  borderWidth={4}
  borderColor="#fff"
  hover={true}
  onClick={handleClick}
/>
```

### Props

- `src` (string): URL da imagem
- `name` (string): Nome para gerar fallback e iniciais
- `size` (number): Tamanho em pixels (padrão: 40)
- `round` (boolean): Se deve ser circular (padrão: true)
- `border` (boolean): Se deve ter borda (padrão: false)
- `borderWidth` (number): Largura da borda em pixels (padrão: 2)
- `borderColor` (string): Cor da borda (padrão: '#fff')
- `hover` (boolean): Se deve ter efeito hover (padrão: false)
- `onClick` (function): Função de click
- `className` (string): Classes CSS adicionais
- `alt` (string): Texto alternativo para acessibilidade

### Características

✅ **Fallback automático** com gradientes únicos baseados no nome  
✅ **Iniciais geradas automaticamente** quando imagem falha  
✅ **12 paletas de cores diferentes** selecionadas por hash do nome  
✅ **Responsivo** com tamanhos adaptativos  
✅ **Acessível** com textos alternativos apropriados  

## 🖼️ ChannelBanner Component

Componente para banners de canal com fallback de gradiente.

### Uso

```jsx
import ChannelBanner from '../components/ChannelBanner';

<ChannelBanner
  src="/path/to/banner.jpg"
  channelName="Nome do Canal"
  height={200}
  rounded={true}
>
  {/* Conteúdo opcional sobre o banner */}
  <h1>Conteúdo do Banner</h1>
</ChannelBanner>
```

### Props

- `src` (string): URL da imagem do banner
- `channelName` (string): Nome do canal para gerar fallback
- `height` (number): Altura em pixels (padrão: 200)
- `rounded` (boolean): Se deve ter bordas arredondadas (padrão: true)
- `children` (ReactNode): Conteúdo opcional sobre o banner
- `className` (string): Classes CSS adicionais
- `alt` (string): Texto alternativo

### Características

✅ **Gradientes únicos** baseados no nome do canal  
✅ **Overlay automático** para melhor legibilidade do conteúdo  
✅ **Suporte a conteúdo sobreposto** com children  
✅ **Responsivo** com diferentes resoluções  

## 🛠️ avatarUtils.js

Utilitários para geração de gradientes e fallbacks.

### Funções Principais

#### `getInitials(name)`
Extrai iniciais de um nome.
```jsx
getInitials("João Silva") // "JS"
getInitials("XandTube") // "XA"
```

#### `getGradientColors(name)`
Gera cores de gradiente baseadas no hash do nome.
```jsx
getGradientColors("João") // ["#FF6B6B", "#4ECDC4"]
```

#### `createGradientStyle(name, direction)`
Cria estilo CSS de gradiente.
```jsx
createGradientStyle("Canal", "135deg")
// { background: "linear-gradient(135deg, #A8E6CF, #FF8B94)" }
```

#### `createGradientDataUrl(name, width, height)`
Gera imagem base64 com gradiente e iniciais.
```jsx
createGradientDataUrl("Canal", 120, 120)
// "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
```

### Paleta de Cores

12 combinações harmoniosas:
1. 🔴→🔵 Vermelho para verde-azulado
2. 🟢→🌸 Verde claro para rosa  
3. 🟡→🟢 Amarelo para verde
4. 🔵→💙 Verde-azulado para azul
5. 🟢→🟡 Verde para amarelo claro
6. 💜→🌿 Lavanda para menta
7. 🟡→💜 Amarelo para roxo
8. 💙→🧡 Azul claro para laranja claro
9. 🌸→🟢 Rosa para verde claro
10. 💜→🌊 Roxo claro para verde-azulado claro
11. 🍑→💙 Pêssego para azul claro
12. 🟢→🟡 Verde claro para amarelo

## 🔄 Componentes Atualizados

### VideoCard
- ✅ Usa novo componente `Avatar` 
- ✅ Fallback automático para avatares de canal
- ✅ Gradientes únicos por canal

### DownloadCard  
- ✅ Fallback com gradiente para thumbnails
- ✅ Iniciais e título quando imagem falha
- ✅ Transição suave entre estados

### ChannelDetailsPage
- ✅ Banner com gradiente fallback
- ✅ Avatar grande com borda
- ✅ Layout melhorado com seções

## 🎯 Benefícios

✅ **Experiência consistente** - Sempre mostra algo bonito  
✅ **Performance** - Fallbacks são gerados localmente  
✅ **Acessibilidade** - Textos alternativos apropriados  
✅ **Branding** - Visual profissional mesmo sem imagens  
✅ **Responsivo** - Adapta a diferentes tamanhos de tela  
✅ **Único** - Cada canal/usuário tem cores únicas  

## 🚀 Uso em Novos Componentes

Para usar em novos componentes:

```jsx
import Avatar from '../components/Avatar';
import ChannelBanner from '../components/ChannelBanner';
import { createGradientStyle, getInitials } from '../utils/avatarUtils';

// Avatar simples
<Avatar src={user.avatar} name={user.name} size={40} />

// Banner com conteúdo
<ChannelBanner src={channel.banner} channelName={channel.name}>
  <h1>{channel.name}</h1>
</ChannelBanner>

// Gradiente customizado
<div style={createGradientStyle(item.name)}>
  <span>{getInitials(item.name)}</span>
</div>
```
