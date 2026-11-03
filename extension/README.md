# DevPulse new tab

A tiny browser extension that shows DevPulse's top stories on every new tab. No permissions: it only reads the public `/api/feed`, renders with plain DOM (never `innerHTML` with network data), and caches the last response so the tab opens instantly — even offline.

## Try it (Chrome, Edge, Brave, Arc)

1. Open `chrome://extensions` and switch on **Developer mode**.
2. Click **Load unpacked** and pick this `extension/` folder.
3. Open a new tab.

To point it at a local server, change `SITE` at the top of `newtab.js` to `http://localhost:3000`.
