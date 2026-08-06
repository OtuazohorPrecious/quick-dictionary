const wordInput = document.getElementById('wordInput');
const searchBtn = document.getElementById('searchBtn');
const speakBtn = document.getElementById('speakBtn');
const refreshBtn = document.getElementById('refreshBtn');
const phoneticEl = document.getElementById('phonetic');
const meaningsEl = document.getElementById('meanings');
const imagesEl = document.getElementById('images');

async function lookup(word) {
  const normalized = word.trim();
  clearResults();
  if (!normalized) return;
  meaningsEl.innerHTML = '<p class="muted">Searching...</p>'; 

  const dictionaryResult = await fetchFromDictionaryApi(normalized);
  if (dictionaryResult) {
    renderDictionary(dictionaryResult, normalized);
    return;
  }

  const wiktionaryResult = await fetchFromWiktionary(normalized);
  if (wiktionaryResult) {
    renderDictionary(wiktionaryResult, normalized);
    return;
  }

  meaningsEl.innerHTML = `<p class="error">No definition found for "${normalized}"</p>`;
}

async function fetchFromDictionaryApi(word) {
  try {
    const res = await fetchWithRetry(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Dictionary API unavailable');
    const data = await res.json();
    const entry = data?.[0];
    if (!entry) return null;

    const phonetic = entry.phonetic || (entry.phonetics || []).find(p => p.text)?.text || '';
    const meanings = (entry.meanings || []).map(meaning => ({
      partOfSpeech: meaning.partOfSpeech || 'Unknown',
      definitions: (meaning.definitions || []).slice(0, 4).map(def => ({
        definition: cleanText(def.definition),
        example: def.example ? cleanText(def.example) : ''
      }))
    }));

    return { word: entry.word || word, phonetic, meanings };
  } catch (err) {
    return null;
  }
}

async function fetchWithRetry(url, options, retries = 2, delayMs = 300) {
  let lastError;
  for (let i = 0; i <= retries; i += 1) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastError = err;
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

async function fetchFromWiktionary(word) {
  try {
    const res = await fetchWithRetry(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Wiktionary unavailable');
    const data = await res.json();
    const entries = data?.en || [];
    if (!entries.length) return null;

    const weight = pos => {
      const lower = (pos || '').toLowerCase();
      if (lower.includes('noun')) return 1;
      if (lower.includes('verb')) return 2;
      if (lower.includes('adjective')) return 3;
      if (lower.includes('adverb')) return 4;
      if (lower.includes('proper')) return 10;
      return 5;
    };

    const sorted = entries.slice().sort((a, b) => weight(a.partOfSpeech) - weight(b.partOfSpeech));
    const meanings = sorted.map(entry => ({
      partOfSpeech: entry.partOfSpeech || 'Unknown',
      definitions: (entry.definitions || []).slice(0, 4).map(def => ({
        definition: cleanText(def.definition),
        example: def.example ? cleanText(def.example) : ''
      }))
    }));

    return { word, phonetic: '', meanings };
  } catch (err) {
    return null;
  }
}

function cleanText(value) {
  if (!value) return '';
  const wrapper = document.createElement('div');
  wrapper.innerHTML = value;
  return (wrapper.textContent || wrapper.innerText || '').replace(/\s+/g, ' ').trim();
}

function renderDictionary(result, word) {
  phoneticEl.textContent = result.phonetic ? `Pronunciation: ${result.phonetic}` : '';

  meaningsEl.innerHTML = '';
  let isNoun = false;

  if (result.meanings && result.meanings.length) {
    result.meanings.forEach(meaning => {
      const ms = document.createElement('div');
      ms.className = 'meaning';
      const pos = document.createElement('h3');
      pos.textContent = meaning.partOfSpeech;
      ms.appendChild(pos);

      const ol = document.createElement('ol');
      meaning.definitions.forEach(def => {
        const li = document.createElement('li');
        li.textContent = def.definition + (def.example ? ` — ${def.example}` : '');
        ol.appendChild(li);
      });

      ms.appendChild(ol);
      meaningsEl.appendChild(ms);
      if (meaning.partOfSpeech.toLowerCase() === 'noun') isNoun = true;
    });
  } else {
    meaningsEl.innerHTML = `<p class="error">No definition found for "${word}"</p>`;
  }

  if (isNoun) {
    fetchImages(word);
  } else {
    imagesEl.innerHTML = '';
  }
}

async function fetchImages(query) {
  imagesEl.innerHTML = '<p class="muted">Loading images…</p>';
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&prop=pageimages&piprop=thumbnail&pithumbsize=400&format=json&origin=*`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('Image lookup failed');

    const json = await res.json();
    const pages = json.query && json.query.pages ? Object.values(json.query.pages) : [];
    const validPages = pages.filter(page => page.thumbnail && page.thumbnail.source);

    imagesEl.innerHTML = '';
    if (!validPages.length) {
      imagesEl.innerHTML = '<p class="muted">No images found.</p>';
      return;
    }

    validPages.forEach(page => {
      const a = document.createElement('a');
      a.href = `https://en.wikipedia.org/?curid=${page.pageid}`;
      a.target = '_blank';
      a.rel = 'noopener';

      const img = document.createElement('img');
      img.alt = page.title;
      img.src = page.thumbnail.source;
      img.onerror = () => {
        img.remove();
      };

      a.appendChild(img);
      imagesEl.appendChild(a);
    });
  } catch (err) {
    imagesEl.innerHTML = '<p class="muted">Images were not available.</p>';
  }
}

function speak(word) {
  if (!word || !('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = navigator.language || 'en-US';
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

function clearResults() {
  phoneticEl.textContent = '';
  meaningsEl.innerHTML = '';
  imagesEl.innerHTML = '';
}

searchBtn.addEventListener('click', () => lookup(wordInput.value));
wordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') lookup(wordInput.value);
});
speakBtn.addEventListener('click', () => speak(wordInput.value));
refreshBtn?.addEventListener('click', () => window.location.reload());

(function checkQuery() {
  try {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      wordInput.value = q;
      lookup(q);
    }
  } catch (e) {}
})();