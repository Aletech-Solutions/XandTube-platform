# Videos Folder

This folder stores videos uploaded to XandTube.

## Structure

```
videos/
├── metadata/          # JSON video metadata (yt-dlp format)
├── video1.mp4         # Video files
├── video2.mp4
└── ...
```

## Metadata

Each video has a corresponding JSON file in `metadata/` with information such as:
- Title and description
- Duration
- Channel
- Tags
- Upload date
- Statistics (views, likes, etc.)

## Supported Formats

- MP4
- AVI
- MKV
- MOV
- WMV
- FLV
- WebM

## Size Limit

- Maximum: 100MB per video