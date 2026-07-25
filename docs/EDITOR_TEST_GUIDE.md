# Mission Control Editor — Test Guide

A single, copy-paste-ready article that exercises **every** Phase 1 editor feature
(live preview, rich editor, autosave, publish validation, featured-image manager,
SEO workspace) plus every content block the `.article-body` renderer supports.

> The article deliberately has good SEO shape (title 30–60 chars, meta description
> 120–160 chars, focus keyword in title/excerpt/body, H2 structure, internal +
> external links, references) so the pre-flight checklist should go **all green**
> and Publish should become enabled — *after you add a featured image*.

---

## 0. Open the editor

1. Sign in at `/admin/login`, then go to **`/admin/articles/new`**.
2. You'll see the **English** language tab and, top-right, the
   **Editor / Split / Preview / SEO** view toggle.

---

## 1. Paste the fields

Copy each value into the matching field.

| Field | Value |
|---|---|
| **Title** | `Artemis II: NASA's First Crewed Return to the Moon` |
| **Slug** | (auto-fills from the title → `artemis-ii-nasas-first-crewed-return-to-the-moon`) |
| **Excerpt** | `Artemis II will fly four astronauts around the Moon in 2026 — NASA's first crewed lunar voyage since Apollo. Inside the mission, crew, and timeline.` |
| **Article Type** (sidebar) | `Mission Update` *(this makes the JSON-LD a `NewsArticle`)* |
| **Author** (sidebar) | pick any, or leave `— No author —` |
| **Category** (sidebar) | select at least one, e.g. `NASA` *(required to publish)* |
| **Focus Keyword** (SEO tab) | `Artemis II` |

---

## 2. Paste the body

The body below uses the exact semantic HTML + classes the public renderer styles,
so it's the best way to load every block at once.

1. In the **Content** editor, click the **`HTML source`** toggle (top-left of the editor).
2. Paste the whole block below into the textarea.
3. Toggle back to **`Rich`** — everything should render as formatted blocks.

```html
<p>Half a century after Apollo 17 left the last human bootprints in lunar dust, <strong>Artemis II</strong> is preparing to carry four astronauts around the Moon. It will be the first crewed flight of NASA's <em>Artemis</em> program — and a full dress rehearsal for the landing that follows.</p>

<h2>What Artemis II will do</h2>
<p>The mission is a <strong>free-return</strong> trip: the Orion spacecraft loops behind the Moon and uses lunar gravity to slingshot home, never entering orbit. It validates every crewed system before <a href="/articles/artemis-iii-south-pole-landing">Artemis III</a> attempts a south-pole landing.</p>
<ul>
  <li>Launch aboard the Space Launch System (SLS)</li>
  <li>A roughly 10-day flight around the Moon and back</li>
  <li>First crew to leave low-Earth orbit since 1972</li>
</ul>

<h3>Readiness checklist</h3>
<ul class="checklist">
  <li data-checked="true">Orion crew module integrated</li>
  <li data-checked="true">SLS core stage stacked</li>
  <li data-checked="false">Crewed launch — targeted for 2026</li>
</ul>

<div class="callout callout-info">
  <p class="callout-title">Info</p>
  <p>A <strong>free-return trajectory</strong> is shaped so that, even with no engine burns, the Moon's gravity sends the spacecraft back toward Earth.</p>
</div>
<div class="callout callout-warning">
  <p class="callout-title">Caution</p>
  <p>All dates are targets, not guarantees — crewed schedules slip as hardware testing demands.</p>
</div>
<div class="callout callout-success">
  <p class="callout-title">Milestone</p>
  <p>Artemis I already flew Orion around the Moon uncrewed in 2022, clearing the way for a crew.</p>
</div>

<h3>The crew</h3>
<blockquote>
  We are going back to the Moon — and this time, to stay.
  <cite>NASA Administrator</cite>
</blockquote>
<div class="table-wrap">
  <table>
    <thead>
      <tr><th>Role</th><th>Astronaut</th><th>Agency</th></tr>
    </thead>
    <tbody>
      <tr><td>Commander</td><td>Reid Wiseman</td><td>NASA</td></tr>
      <tr><td>Pilot</td><td>Victor Glover</td><td>NASA</td></tr>
      <tr><td>Mission Specialist</td><td>Christina Koch</td><td>NASA</td></tr>
      <tr><td>Mission Specialist</td><td>Jeremy Hansen</td><td>CSA</td></tr>
    </tbody>
  </table>
</div>

<aside class="fact-card">
  <p class="fact-label">Mission Facts</p>
  <dl>
    <dt>Spacecraft</dt><dd>Orion</dd>
    <dt>Rocket</dt><dd>SLS Block 1</dd>
    <dt>Crew</dt><dd>4 astronauts</dd>
    <dt>Duration</dt><dd>~10 days</dd>
  </dl>
</aside>

<h2>How the trajectory works</h2>
<p>The circular-orbit velocity scales with the gravitational parameter <em>GM</em> and orbital radius <em>r</em>:</p>
<p class="math-block">v = &radic;(GM / r)</p>
<p>Engineers write the escape condition as E = &frac12;mv<sup>2</sup> &minus; GMm/r &ge; 0, with the reference altitude denoted r<sub>0</sub>.</p>
<pre><code>def specific_energy(v, r, GM):
    # positive energy => escape trajectory
    return 0.5 * v**2 - GM / r</code></pre>

<h3>Timeline</h3>
<ol class="timeline">
  <li><span class="t-when">1972</span>Apollo 17 — the last crewed lunar mission</li>
  <li><span class="t-when">2022</span>Artemis I — uncrewed Orion flight around the Moon</li>
  <li><span class="t-when">2026</span>Artemis II — first crewed Artemis flight</li>
  <li><span class="t-when">2027+</span>Artemis III — crewed south-pole landing</li>
</ol>

<h3>Common questions</h3>
<details class="faq">
  <summary>Will Artemis II land on the Moon?</summary>
  <p>No. Artemis II is a crewed fly-by; the landing is Artemis III.</p>
</details>
<details class="faq">
  <summary>Who are NASA's international partners?</summary>
  <p>The Canadian Space Agency provides an astronaut and robotics; ESA builds Orion's service module.</p>
</details>

<hr>

<!-- QA ONLY — this paragraph and the <hr> above it exist only to exercise every
     inline style in one place. DELETE both before publishing a real article. -->
<p><strong>Formatting sampler (for QA):</strong> <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, <mark>highlight</mark>, <code>inline code</code>, keyboard <kbd>Ctrl</kbd>+<kbd>K</kbd>, an external source at <a href="https://www.nasa.gov/artemis">NASA.gov</a>, superscript 10<sup>3</sup>, and subscript H<sub>2</sub>O.</p>

<div class="references">
  <p class="references-title">References</p>
  <ol>
    <li>NASA, <em>Artemis II Mission Overview</em>, nasa.gov (2026).</li>
    <li>Canadian Space Agency, <em>Jeremy Hansen — Artemis II</em> (2026).</li>
  </ol>
</div>
```

> There is a fourth callout colour, `callout-danger` (red), available via HTML
> (`<div class="callout callout-danger">…</div>`) — add one if you want to see it.

> **About the last paragraph ("Formatting sampler (for QA)").** That line — and the
> `<hr>` above it — are **not real article content**. They exist only to render every
> inline style (bold, italic, underline, strikethrough, highlight, inline code, `kbd`,
> link, superscript, subscript) in one visible place so you can confirm they all work.
> **Delete both before publishing a real article** (the same applies to the Hindi copy).

---

## 3. Feature-by-feature test checklist

### A. Live preview  *(Objective 1)*
- [ ] Click **Preview** — the article renders using the **exact production component**.
- [ ] Toggle **Desktop / Tablet / Mobile** — the layout re-flows to real viewport
      widths instantly (headings shrink on mobile, etc.). No page reload.
- [ ] Toggle the **sun/moon** button in the preview toolbar — light ⇄ dark, matching production.
- [ ] Switch to **Split** and edit the Title/Excerpt — the preview updates live as you type.
- [ ] Confirm the preview shows **reading time + word count** and, since it's unpublished,
      an **"est." publish date**.

### B. Rich content editor  *(Objective 2)*
- [ ] In **Rich** mode, type `/` on an empty line — the **slash command palette** opens.
      Insert a **Table**, a **Callout**, a **Divider**, a **Timeline** from it.
- [ ] Insert an **Image** in the body (toolbar image button or `/image`) via the Media
      Library — add a caption/alt. *(This also clears the optional "Has imagery"
      suggestion, since the pasted article has no in-body images.)*
- [ ] Select some text and use the toolbar: **Bold, Italic, Underline, Strikethrough,
      Highlight, Inline code, Link**.
- [ ] **Markdown shortcuts:** on a new line type `## ` → Heading 2; `### ` → Heading 3;
      `- ` → bullet list; `> ` → quote; `1. ` → numbered list; type `---` then Enter → divider.
- [ ] **Keyboard shortcuts:** `Ctrl/Cmd+B/I/U`, `Ctrl+K` (link), `Ctrl+Shift+7/8`
      (numbered/bulleted list), `Ctrl+Alt+2/3/4` (headings).
- [ ] **Paste test:** copy a few paragraphs from a Google Doc / Wikipedia / NASA page and
      paste — formatting is kept, but inline styles/scripts are stripped (clean HTML).
- [ ] Toggle **HTML source** ⇄ **Rich** — content round-trips cleanly.

### C. Autosave  *(Objective 3)*
- [ ] Watch the **save indicator** in the sidebar Publish panel: it moves through
      **Unsaved changes → Saving… → Saved just now** as you pause.
- [ ] **Draft recovery:** make an edit, wait for "Saved", then **reload the page** — a
      gold **"Unsaved changes from a previous session were found"** banner appears with
      **Restore / Discard**. *(Best tested on an existing article in edit mode, where the
      server autosaves; a brand-new unsaved article keeps a local backup only.)*
- [ ] **Multi-tab conflict:** open the same article in a **second browser tab** — a
      warning banner appears in both: *"open in another tab…"*.
- [ ] Toggle your network offline (DevTools) — the indicator shows **Offline — saved locally**.

### D. Publish validation  *(Objective 4)*
- [ ] Open the sidebar **Pre-flight** panel. Before adding a featured image + category,
      **Publish is disabled** and the checklist shows the ✕ items to fix.
- [ ] Add a **category** and a **featured image** (next section) → the checklist turns to
      **"Ready to publish"** and **Publish enables**.
- [ ] Expand **"suggestions"** to see warnings/SEO hints (✓ / ⚠ rows).
- [ ] Confirm the three **score meters** (SEO / Read / Content) are populated and rise as
      the article fills out. **Save as Draft always works**, even with issues.

### E. Featured image manager  *(Objective 5)*
*(You provide the image — any URL, or use **Browse** → Media Library.)*
- [ ] Add an image via **Browse**, by **pasting a URL**, or by **dragging an image URL**
      onto the drop zone.
- [ ] The preview shows a **resolution / format** note (e.g. "Good resolution 1600×900")
      and warns on tiny images or a missing alt text.
- [ ] **Click the image** to set the **focal point** — the crosshair moves and the crop
      re-centers (verify it in the live Preview hero).
- [ ] Fill **Alt text**, then expand **Attribution & licensing** and add
      **Caption / Credit** — these appear under the hero image in Preview.

### F. SEO workspace  *(Objective 6)*
- [ ] Click the **SEO** tab. Check the **Google**, **X / Twitter**, and **Facebook**
      previews reflect your title, excerpt and featured image.
- [ ] The **SEO title** and **Meta description** counters should sit in the green band
      (30–60 and 120–160). Try **Optimise** / **Generate** to auto-fill.
- [ ] Set **Focus Keyword** = `Artemis II` — the **SEO analysis** rows for keyword in
      title / description / body turn green.
- [ ] Watch the **SEO / Readability / Content** scores.
- [ ] Scroll to **Structured data (JSON-LD)** — it should be a `NewsArticle` (because the
      type is *Mission Update*). Click **Copy**. This is the same JSON-LD now emitted on
      the public article page.

---

## 4. Publish & verify on the site
1. With everything green, click **Publish**.
2. Open **View Article** (sidebar) — confirm the public page matches the Preview exactly:
   every block, the hero with your focal point + caption/credit, both light and dark.
3. **View source** on the article and confirm the `<script type="application/ld+json">`
   block is present (the JSON-LD from the SEO tab).

---

## 5. What "all green" looks like
With the article above **plus a ≥1200px-wide featured image with alt text and a category
selected**, the pre-flight checklist reports **Ready to publish** and all **required**
checks ✓ (title, slug, excerpt, content, featured image, category), with SEO/Content
scores in the high band.

One expected **suggestion** (a warning, not a blocker) remains: **"Has imagery"** — the
pasted article has no in-body `<img>`. Insert one body image (step B) to clear it. Any
other ⚠ rows are optional polish; warnings never block Publish.

---

## 6. Bilingual (Hindi) translation test  *(हिन्दी)*

The Hindi version shares the English article's slug, image, author, categories and view
count — **only the text changes.** It lives in a separate language tab.

### Flow
1. **Save/create the English article first** (Publish or Save as Draft). Translations are
   only available in **edit mode**, so the हिन्दी tab is disabled on a brand-new article.
2. At the top of the editor, click the **हिन्दी** language tab (next to **English**).
   The translation tab has its own **Editor / Split / Preview** toggle and autosave.
3. Paste the Hindi **Title** and **Excerpt** below. For the **Content**, switch the
   content editor to **`HTML source`**, paste the Hindi HTML block, then toggle back to
   **`Rich`** — it renders as blocks in the Devanagari reading font, with the rendered
   **English reference** beside it. The rule: **keep the same HTML tags, translate only
   the words between them** (already done for you below).
4. Turn on **"Show this हिन्दी translation to readers"**, then **Save translation**.
5. Visit **`/hi/articles/<slug>`** (e.g. `/hi/articles/artemis-ii-nasas-first-crewed-return-to-the-moon`).
   Verify the on-page **language toggle (EN ⇄ हिन्दी)** appears on both language pages,
   the Devanagari reading font is used, and every block renders exactly like English.

### Feature checks (the translation editor has its own upgrades)
- [ ] **Rich editor** — same block editor as English (toolbar, `/` slash commands,
      shortcuts, sanitized paste), typing in the Devanagari serif font.
- [ ] **Editor mode** — the **rendered English reference** sits beside the Hindi editor.
- [ ] **Split / Preview** — the live preview renders the Hindi text with the **shared
      English metadata** (featured image + focal point, categories, tags, author) — i.e.
      exactly what `/hi/articles/<slug>` will ship — with device + theme switching.
- [ ] **Autosave** — the save-state pill (Saving… / Saved just now), reload **draft
      recovery**, and the **two-tab conflict** warning all work for the translation too.
      *(Server autosave starts after the first manual "Create translation"; before that
      changes are backed up locally.)*
- [ ] **Translation pre-flight** — with the Hindi block below pasted, it shows
      ✓ *HTML structure matches English (tag-for-tag)* and ✓ *Length in line with
      English*. Now **delete one callout** from the Hindi content — the pre-flight flips
      to ⚠ and names the first mismatching block. Undo to go green again.

### Paste — Hindi fields

| Field | Value |
|---|---|
| **Title (हिन्दी)** | `आर्टेमिस II: नासा की चंद्रमा पर पहली मानवयुक्त वापसी` |
| **Excerpt (हिन्दी)** | `आर्टेमिस II 2026 में चार अंतरिक्ष यात्रियों को चंद्रमा के चारों ओर ले जाएगा — अपोलो के बाद नासा की पहली मानवयुक्त चंद्र यात्रा। मिशन, दल और समयरेखा की पूरी जानकारी।` |

### Paste — Hindi content (same structure as English)

```html
<p>अपोलो 17 द्वारा चंद्र धूल में अंतिम मानव पदचिह्न छोड़े जाने के आधी सदी बाद, <strong>आर्टेमिस II</strong> चार अंतरिक्ष यात्रियों को चंद्रमा के चारों ओर ले जाने की तैयारी कर रहा है। यह नासा के <em>आर्टेमिस</em> कार्यक्रम की पहली मानवयुक्त उड़ान होगी — और उसके बाद होने वाली लैंडिंग का पूर्ण पूर्वाभ्यास।</p>

<h2>आर्टेमिस II क्या करेगा</h2>
<p>यह मिशन एक <strong>फ्री-रिटर्न</strong> यात्रा है: ओरायन अंतरिक्ष यान चंद्रमा के पीछे चक्कर लगाता है और कक्षा में प्रवेश किए बिना चंद्र गुरुत्वाकर्षण का उपयोग करके घर की ओर लौटता है। यह <a href="/articles/artemis-iii-south-pole-landing">आर्टेमिस III</a> द्वारा दक्षिणी-ध्रुव लैंडिंग का प्रयास करने से पहले हर मानवयुक्त प्रणाली को सत्यापित करता है।</p>
<ul>
  <li>स्पेस लॉन्च सिस्टम (SLS) पर प्रक्षेपण</li>
  <li>चंद्रमा के चारों ओर और वापसी की लगभग 10-दिन की उड़ान</li>
  <li>1972 के बाद निम्न-पृथ्वी कक्षा छोड़ने वाला पहला दल</li>
</ul>

<h3>तैयारी चेकलिस्ट</h3>
<ul class="checklist">
  <li data-checked="true">ओरायन क्रू मॉड्यूल एकीकृत</li>
  <li data-checked="true">SLS कोर स्टेज संयोजित</li>
  <li data-checked="false">मानवयुक्त प्रक्षेपण — 2026 के लिए लक्षित</li>
</ul>

<div class="callout callout-info">
  <p class="callout-title">जानकारी</p>
  <p>एक <strong>फ्री-रिटर्न प्रक्षेप-पथ</strong> इस तरह आकार दिया जाता है कि बिना किसी इंजन बर्न के भी, चंद्रमा का गुरुत्वाकर्षण अंतरिक्ष यान को पृथ्वी की ओर वापस भेज देता है।</p>
</div>
<div class="callout callout-warning">
  <p class="callout-title">सावधानी</p>
  <p>सभी तिथियाँ लक्ष्य हैं, गारंटी नहीं — हार्डवेयर परीक्षण की माँग के अनुसार मानवयुक्त कार्यक्रम खिसकते रहते हैं।</p>
</div>
<div class="callout callout-success">
  <p class="callout-title">उपलब्धि</p>
  <p>आर्टेमिस I पहले ही 2022 में ओरायन को बिना दल के चंद्रमा के चारों ओर उड़ा चुका है, जिससे दल के लिए रास्ता साफ़ हो गया।</p>
</div>

<h3>दल</h3>
<blockquote>
  हम चंद्रमा पर वापस जा रहे हैं — और इस बार, रुकने के लिए।
  <cite>नासा प्रशासक</cite>
</blockquote>
<div class="table-wrap">
  <table>
    <thead>
      <tr><th>भूमिका</th><th>अंतरिक्ष यात्री</th><th>एजेंसी</th></tr>
    </thead>
    <tbody>
      <tr><td>कमांडर</td><td>रीड वाइज़मैन</td><td>नासा</td></tr>
      <tr><td>पायलट</td><td>विक्टर ग्लोवर</td><td>नासा</td></tr>
      <tr><td>मिशन विशेषज्ञ</td><td>क्रिस्टीना कोच</td><td>नासा</td></tr>
      <tr><td>मिशन विशेषज्ञ</td><td>जेरेमी हैनसेन</td><td>CSA</td></tr>
    </tbody>
  </table>
</div>

<aside class="fact-card">
  <p class="fact-label">मिशन तथ्य</p>
  <dl>
    <dt>अंतरिक्ष यान</dt><dd>ओरायन</dd>
    <dt>रॉकेट</dt><dd>SLS ब्लॉक 1</dd>
    <dt>दल</dt><dd>4 अंतरिक्ष यात्री</dd>
    <dt>अवधि</dt><dd>~10 दिन</dd>
  </dl>
</aside>

<h2>प्रक्षेप-पथ कैसे काम करता है</h2>
<p>वृत्ताकार-कक्षा वेग गुरुत्वाकर्षण प्राचल <em>GM</em> और कक्षीय त्रिज्या <em>r</em> के साथ बदलता है:</p>
<p class="math-block">v = &radic;(GM / r)</p>
<p>इंजीनियर पलायन शर्त को E = &frac12;mv<sup>2</sup> &minus; GMm/r &ge; 0 के रूप में लिखते हैं, जहाँ संदर्भ ऊँचाई को r<sub>0</sub> से दर्शाया जाता है।</p>
<pre><code>def specific_energy(v, r, GM):
    # positive energy => escape trajectory
    return 0.5 * v**2 - GM / r</code></pre>

<h3>समयरेखा</h3>
<ol class="timeline">
  <li><span class="t-when">1972</span>अपोलो 17 — अंतिम मानवयुक्त चंद्र मिशन</li>
  <li><span class="t-when">2022</span>आर्टेमिस I — चंद्रमा के चारों ओर ओरायन की बिना-दल उड़ान</li>
  <li><span class="t-when">2026</span>आर्टेमिस II — पहली मानवयुक्त आर्टेमिस उड़ान</li>
  <li><span class="t-when">2027+</span>आर्टेमिस III — मानवयुक्त दक्षिणी-ध्रुव लैंडिंग</li>
</ol>

<h3>सामान्य प्रश्न</h3>
<details class="faq">
  <summary>क्या आर्टेमिस II चंद्रमा पर उतरेगा?</summary>
  <p>नहीं। आर्टेमिस II एक मानवयुक्त फ्लाई-बाय है; लैंडिंग आर्टेमिस III है।</p>
</details>
<details class="faq">
  <summary>नासा के अंतरराष्ट्रीय साझेदार कौन हैं?</summary>
  <p>कनाडाई अंतरिक्ष एजेंसी एक अंतरिक्ष यात्री और रोबोटिक्स प्रदान करती है; ESA ओरायन का सर्विस मॉड्यूल बनाता है।</p>
</details>

<hr>

<!-- QA ONLY — this paragraph and the <hr> above it exist only to exercise every
     inline style in one place. DELETE both before publishing a real article. -->
<p><strong>फ़ॉर्मेटिंग नमूना (QA के लिए):</strong> <strong>बोल्ड</strong>, <em>इटैलिक</em>, <u>रेखांकित</u>, <s>काट</s>, <mark>हाइलाइट</mark>, <code>इनलाइन कोड</code>, कीबोर्ड <kbd>Ctrl</kbd>+<kbd>K</kbd>, <a href="https://www.nasa.gov/artemis">NASA.gov</a> पर एक बाहरी स्रोत, सुपरस्क्रिप्ट 10<sup>3</sup>, और सबस्क्रिप्ट H<sub>2</sub>O।</p>

<div class="references">
  <p class="references-title">संदर्भ</p>
  <ol>
    <li>नासा, <em>आर्टेमिस II मिशन अवलोकन</em>, nasa.gov (2026)।</li>
    <li>कनाडाई अंतरिक्ष एजेंसी, <em>जेरेमी हैनसेन — आर्टेमिस II</em> (2026)।</li>
  </ol>
</div>
```

> **Tag parity matters:** the Hindi HTML above intentionally mirrors the English tag/class
> structure one-to-one (same `<h2>/<h3>`, `checklist`, `callout-*`, `table-wrap`,
> `fact-card`, `timeline`, `faq`, `references`, `math-block`, and the same `href`s), so the
> Hindi page renders identically — only the words are translated. The `<pre><code>` block is
> code, so it's left unchanged.
