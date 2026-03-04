# JobTracker Chrome Extension

Save jobs to your JobTracker from any job board with one click.

## Supported Sites

- **LinkedIn** — `/jobs/view/*` pages
- **Indeed** — `/viewjob` pages
- **Greenhouse** — `boards.greenhouse.io` postings
- **Lever** — `jobs.lever.co` postings
- **Workday** — `*.myworkdayjobs.com` postings
- **Ashby** — `ashbyhq.com` postings
- **Any page** — generic fallback uses JSON-LD and heuristics

## Development

### Load the extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `/extension` folder from this project
5. The extension icon appears in your toolbar

### Connect to local JobTracker

1. Click the extension icon in the toolbar
2. If prompted, click the **Settings** gear icon
3. Set the URL to `http://localhost:3000`
4. Make sure you're **logged into JobTracker** in the same Chrome profile

### After code changes

1. Go to `chrome://extensions`
2. Click the **refresh** icon on the JobTracker extension card
3. Close and reopen the popup to see changes

## How It Works

1. **Content script** runs on every page and extracts job data from the DOM
2. **Background service worker** manages badge state, auth, and API calls
3. **Popup** shows extracted data for review and lets you save with one click
4. **API routes** on the Next.js app handle the save, auth check, and duplicate detection

### Confidence Scoring

Each extractor returns a confidence score (0–100):

| Score | Meaning | Badge |
|-------|---------|-------|
| 70+ | High confidence — job detected | Green ✓ |
| 40–70 | Medium — some fields may be off | Orange ? |
| < 40 | Low/none — no job detected | No badge |

## Database Migration

The extension adds a `source` field to the `Application` model. Run:

```bash
npx prisma db push
# or
npx prisma migrate dev --name add-application-source
```

## Folder Structure

```
extension/
├── manifest.json          # Extension configuration
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Styles (dark theme, DM Mono)
│   └── popup.js           # Popup logic and state management
├── content/
│   ├── extractors.js      # Site-specific DOM extractors
│   └── content.js         # Detection orchestration + SPA support
├── background/
│   └── background.js      # Service worker, badge, context menu
├── lib/
│   ├── api.js             # JobTracker API client
│   ├── storage.js         # chrome.storage helpers
│   └── parser.js          # Text cleaning utilities
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── generate-icons.html  # Open in browser to regenerate icons
└── README.md
```

## Production

1. Update `host_permissions` in `manifest.json` to include your production domain
2. Optionally replace the default API URL in `background.js`
3. Zip the `/extension` folder
4. Submit to the [Chrome Web Store](https://chrome.google.com/webstore/devconsole)
