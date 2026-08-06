Quick Dictionary — Speak & See

A minimal frontend web app that looks up English words, shows pronunciation and definitions, and fetches images for nouns.

How it works

- Dictionary data: https://dictionaryapi.dev (no key required)
- Images: Wikimedia Commons / Wikipedia API (no key required)
- Pronunciation: browser SpeechSynthesis API

Deploy to GitHub Pages (simplest publish)

1. Create a repository on GitHub (name it e.g. `quick-dictionary`).
2. On your machine, from the project folder run:

```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

3. In your repo settings, set GitHub Pages to use:
   - `Branch: main`
   - `Folder: / (root)`

4. Wait 1-2 minutes, then open:
   - `https://<your-username>.github.io/<your-repo>/`

5. On your phone open that site URL and use the browser menu to "Install app" or "Add to Home Screen".

Notes:
- No GitHub Actions workflow is required for this simple static site.
- A blank `.nojekyll` file is included to prevent GitHub Pages from trying to process the site with Jekyll.
- If you want, I can also publish a `docs/` folder instead, but root publishing is simplest.

Run locally

Open the folder in a browser tab — using a local server is recommended. From the project folder run:

```bash
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

Or use the VS Code Live Server extension.

Usage

- Type a word and press Enter or click `Lookup`.
- Click the speaker button to hear the word pronounced by your browser.
- If the word is a noun, images will appear (from Wikipedia search results).

- If an answer does not appear immediately, press `Enter` again or use the refresh button added to the app.

Notes

- Some words may not have phonetic text in the API response; the speaker still pronounces the typed word via SpeechSynthesis.
- Wikimedia search may return pages without thumbnails for some queries.

Install on your phone

1. Deploy the app to a public URL so your phone can reach it without localhost.
2. Open the URL in your phone browser.
3. Use the browser menu and choose `Install app` / `Add to Home Screen`.
4. If the app returns stale results, tap the refresh button to update the page.

Deployment options

- GitHub Pages: good for free static hosting with no backend.
- Netlify / Vercel: fast free hosting, drag-and-drop or connect your repo.
- Any simple static host or S3 bucket with website hosting.

How it works on your phone

- The app runs entirely in the browser.
- It fetches definitions from online dictionary APIs.
- It uses your phone’s built-in speech synthesis for pronunciation.
- Once installed, it behaves like an app and can be launched from your home screen.

