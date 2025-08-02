# Pasta de Vídeos

Esta pasta armazena os vídeos enviados para o XandTube.

## Estrutura

```
videos/
├── metadata/          # Metadados JSON dos vídeos (formato yt-dlp)
├── video1.mp4         # Arquivos de vídeo
├── video2.mp4
└── ...
```

## Metadados

Cada vídeo possui um arquivo JSON correspondente em `metadata/` com informações como:
- Título e descrição
- Duração
- Canal
- Tags
- Data de upload
- Estatísticas (views, likes, etc.)

## Formatos Suportados

- MP4
- AVI
- MKV
- MOV
- WMV
- FLV
- WebM

## Limite de Tamanho

- Máximo: 100MB por vídeo