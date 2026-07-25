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
