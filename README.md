# Radius Map

Draw a radius circle around any address. Built with Leaflet.js + OpenStreetMap. No API key required.

**Live:** https://radius-map.vercel.app

## Features
- Address search with autocomplete (Nominatim)
- Radius slider: 0.1–50 miles or km
- Click-to-center mode
- Color picker + fill opacity
- Stats: area in mi² and km²
- Export coordinates or JSON
- No backend, no database, no account required

## Stack
- [Leaflet.js](https://leafletjs.com/) — map engine
- [OpenStreetMap](https://www.openstreetmap.org/) — map tiles
- [Nominatim](https://nominatim.org/) — geocoding
- [Vercel](https://vercel.com/) — hosting

## Local Development
No build step needed — open `index.html` in a browser via a local server:

```bash
# Python
python3 -m http.server 3000

# Node
npx serve .
```

> Note: OSM tiles require an HTTP/HTTPS origin. Opening `index.html` directly as a `file://` URL will block tiles.

## Deploy
```bash
git push origin main
```
Vercel auto-deploys on every push to `main`.

## Docs
- [User Guide](./USER_GUIDE.md)
- [Sprint Tracker](./SPRINT.md)
- [Session Protocol](./CLAUDE.md)
