// The site's own words — every fixed string the chrome renders, in each
// language it renders them in.
//
// Scope: **UI text only.** Anything an author writes (article titles, mission
// descriptions, learn excerpts) lives in the `*_translations` tables and is
// fetched, never listed here. The rule of thumb: if changing it needs a deploy,
// it belongs in this file; if it needs the admin, it does not.
//
// Nav labels are the deliberate exception and stay in `config/navigation.ts`
// beside their English originals — that tree is data, and splitting a label
// from the href it names makes the nav harder to edit, not easier.
//
// ── What does NOT get translated ─────────────────────────────────────────
//
// Names stay in Latin script, always. **APOD, NASA, ISRO, ESA, ISS, JWST,
// Voyager 1, CubeSat** are what these things are *called* — respelling them in
// Devanagari (नासा एपीओडी, वॉयेजर 1) produces the same letters in a different
// alphabet, which is not a translation and helps nobody: it is harder to
// recognise, it does not match what a reader would search for, and it breaks
// the link between the label and the source it names.
//
// The line is script, not language. A **loanword in ordinary Hindi use** is
// correctly written in Devanagari — लाइव, गैलरी, ट्रैकर, रोवर, लैंडर, टेलीमेट्री
// are how Hindi actually writes those words, and Latinising them would be the
// mirror-image mistake. Mixed strings are normal and expected: `ISS ट्रैकर`,
// `APOD संग्रह`.
//
// Test: `no Hindi string was left as a copy of the English` in ui.test.ts
// enforces that everything else IS translated, and carries an explicit
// allow-list of the proper nouns exempted here — so a name kept in English is
// a recorded decision and a forgotten translation is still a failure.
//
// `satisfies` below is doing real work: it pins the key union for `UIKey` while
// still requiring **every** language on **every** entry, so adding a language
// to `lib/i18n.ts` turns each missing translation into a compile error rather
// than a silent English string in production.

import { DEFAULT_LANGUAGE, type LanguageCode } from './i18n.ts'

type Entry = Record<LanguageCode, string>

const UI = {
  // ── Site chrome ──────────────────────────────────────────────
  'chrome.search':       { en: 'Search',            hi: 'खोजें'            },
  'chrome.openMenu':     { en: 'Open menu',         hi: 'मेन्यू खोलें'      },
  'chrome.closeMenu':    { en: 'Close menu',        hi: 'मेन्यू बंद करें'    },
  'chrome.back':         { en: 'Back',              hi: 'वापस'             },
  'chrome.main':         { en: 'Main',              hi: 'मुख्य'             },
  'chrome.sections':     { en: 'Sections',          hi: 'अनुभाग'           },
  'chrome.highlights':   { en: 'Highlights',        hi: 'मुख्य अंश'         },
  'chrome.allArticles':  { en: 'All articles',      hi: 'सभी लेख'          },
  'chrome.noHighlights': { en: 'Fresh coverage lands on the articles page.', hi: 'नई कवरेज लेख पृष्ठ पर आती है।' },
  'chrome.minRead':      { en: '{n} min read',      hi: '{n} मिनट पढ़ें'    },

  // ── Shared across listings ───────────────────────────────────
  'common.loading':      { en: 'Loading…',          hi: 'लोड हो रहा है…'    },
  'common.loadingMore':  { en: 'Loading more…',     hi: 'और लोड हो रहा है…' },

  // ── Footer ───────────────────────────────────────────────────
  'footer.platform':     { en: 'Platform',          hi: 'मंच'              },
  'footer.intelligence': { en: 'Intelligence',      hi: 'इंटेलिजेंस'        },
  'footer.organization': { en: 'Organization',      hi: 'संगठन'            },
  'footer.tagline':      { en: 'Independent Space Intelligence Organization', hi: 'स्वतंत्र अंतरिक्ष इंटेलिजेंस संगठन' },
  // The brand block. English mirrors `siteConfig.positioning`/`.description`
  // rather than replacing them — those two still feed SEO metadata, where the
  // language is decided per page by `buildPageMetadata`, not by the footer.
  'footer.positioning':  { en: 'Independent Space Intelligence Organization', hi: 'स्वतंत्र अंतरिक्ष इंटेलिजेंस संगठन' },
  'footer.description':  { en: 'Scientific journalism, live mission tracking, deep-space telemetry, and an educational knowledge engine — all in one independent platform.', hi: 'वैज्ञानिक पत्रकारिता, लाइव मिशन ट्रैकिंग, गहन-अंतरिक्ष टेलीमेट्री और एक शैक्षिक ज्ञान इंजन — सब एक स्वतंत्र मंच पर।' },

  // ── Live status strip (home) ─────────────────────────────────
  'strip.issPosition':   { en: 'ISS Position',      hi: 'ISS स्थिति'        },
  'strip.liveTracking':  { en: '● Live tracking',   hi: '● लाइव ट्रैकिंग'    },
  'strip.nextLaunch':    { en: 'Next Launch',       hi: 'अगला लॉन्च'        },
  'strip.viewSchedule':  { en: 'View Schedule',     hi: 'कार्यक्रम देखें'     },
  'strip.apod':          { en: 'NASA APOD',         hi: 'NASA APOD'         },
  'strip.todaysImage':   { en: "Today's Image",     hi: 'आज की तस्वीर'      },
  'strip.updatedDaily':  { en: 'Updated daily',     hi: 'रोज़ अपडेट'         },
  'strip.voyager':       { en: 'Voyager 1',         hi: 'Voyager 1'         },
  'strip.interstellar':  { en: 'Interstellar · 46 yrs', hi: 'तारेतर अंतरिक्ष · 46 वर्ष' },
  'strip.interstellarKms': { en: 'Interstellar · {n} km/s', hi: 'तारेतर अंतरिक्ष · {n} किमी/से' },
  'strip.kmh':           { en: '{n} km/h',          hi: '{n} किमी/घंटा'     },
  'strip.billionKm':     { en: '{n} billion km',    hi: '{n} अरब किमी'      },
  'strip.deepSpace':     { en: 'Deep Space',        hi: 'गहन अंतरिक्ष'       },
  'strip.probes':        { en: '{n} Probes',        hi: '{n} प्रोब'         },
  'strip.telemetry':     { en: 'Live telemetry',    hi: 'लाइव टेलीमेट्री'     },

  // ── About block (home) ───────────────────────────────────────
  'about.eyebrow':       { en: 'Our Mission',       hi: 'हमारा मिशन'        },
  'about.headline':      { en: 'Space belongs to everyone — and understanding it should be accessible, scientific, and deeply honest.', hi: 'अंतरिक्ष सबका है — और उसे समझना सुलभ, वैज्ञानिक और पूरी तरह ईमानदार होना चाहिए।' },
  'about.body':          { en: 'An independent platform committed to scientific accuracy, editorial integrity, and building the most credible space knowledge ecosystem on the web. Not a news portal. Not a blog. A space intelligence organization.', hi: 'वैज्ञानिक सटीकता, संपादकीय ईमानदारी और वेब पर सबसे विश्वसनीय अंतरिक्ष ज्ञान तंत्र बनाने के लिए प्रतिबद्ध एक स्वतंत्र मंच। न कोई समाचार पोर्टल, न कोई ब्लॉग — एक अंतरिक्ष इंटेलिजेंस संगठन।' },
  'about.cta':           { en: 'About us',          hi: 'हमारे बारे में'      },
  'about.statMissions':  { en: 'Missions tracked',  hi: 'मिशन ट्रैक किए गए'  },
  'about.statSystems':   { en: 'Live systems',      hi: 'लाइव सिस्टम'        },
  'about.statTrust':     { en: 'Trust',             hi: 'भरोसा'             },
  'about.statTrustSub':  { en: 'First, always',     hi: 'हमेशा सबसे पहले'    },

  // ── Home ─────────────────────────────────────────────────────
  'home.featuredStory':  { en: 'Featured Story',    hi: 'विशेष कहानी'      },
  'home.readFullStory':  { en: 'Read Full Story',   hi: 'पूरी कहानी पढ़ें'  },
  'home.readLatest':     { en: 'Read Latest',       hi: 'नवीनतम पढ़ें'      },
  'home.viewLive':       { en: 'View Live Systems', hi: 'लाइव सिस्टम देखें' },
  'home.latestArticles': { en: 'Latest Articles',   hi: 'नवीनतम लेख'       },
  'home.latestEyebrow':  { en: 'Space intelligence & journalism', hi: 'अंतरिक्ष जानकारी और पत्रकारिता' },
  'home.viewAll':        { en: 'View all',          hi: 'सभी देखें'        },
  'home.missionsTitle':  { en: 'Active & Upcoming Missions', hi: 'सक्रिय और आगामी मिशन' },
  'home.missionsEyebrow':{ en: 'Mission tracking',  hi: 'मिशन ट्रैकिंग'     },
  'home.allMissions':    { en: 'All missions',      hi: 'सभी मिशन'         },
  'home.learnTitle':     { en: 'Learn Space Science', hi: 'अंतरिक्ष विज्ञान सीखें' },
  'home.learnEyebrow':   { en: 'Knowledge layer',   hi: 'ज्ञान परत'        },
  'home.exploreTopics':  { en: 'Explore all topics', hi: 'सभी विषय देखें'  },
  'home.noArticles':     { en: 'No articles published yet.', hi: 'अभी तक कोई लेख प्रकाशित नहीं हुआ।' },
  'home.noMissions':     { en: 'No missions tracked yet.',   hi: 'अभी तक कोई मिशन ट्रैक नहीं किया गया।' },
  'home.noTopics':       { en: 'No topics published yet.',   hi: 'अभी तक कोई विषय प्रकाशित नहीं हुआ।' },

  // ── Articles ─────────────────────────────────────────────────
  'articles.eyebrow':    { en: 'Space Intelligence', hi: 'अंतरिक्ष जानकारी' },
  'articles.title':      { en: 'Articles',          hi: 'लेख'              },
  'articles.lede':       { en: 'Scientific journalism, mission updates, and discoveries from across the space industry.', hi: 'वैज्ञानिक पत्रकारिता, मिशन अपडेट और अंतरिक्ष उद्योग से जुड़ी खोजें।' },
  'articles.empty':      { en: 'No articles published yet.', hi: 'अभी तक कोई लेख प्रकाशित नहीं हुआ।' },
  'articles.emptyHint':  { en: 'Articles published from the admin panel will appear here.', hi: 'एडमिन पैनल से प्रकाशित लेख यहाँ दिखाई देंगे।' },
  'articles.emptyCat':   { en: 'No articles in this category yet.', hi: 'इस श्रेणी में अभी कोई लेख नहीं है।' },
  'articles.endOne':     { en: 'You’ve reached the end · {n} article',  hi: 'आप अंत तक पहुँच गए · {n} लेख' },
  'articles.endMany':    { en: 'You’ve reached the end · {n} articles', hi: 'आप अंत तक पहुँच गए · {n} लेख' },
  'articles.back':       { en: '← Back to Articles', hi: '← लेखों पर वापस' },
  'articles.related':    { en: 'Related Stories',   hi: 'संबंधित कहानियाँ'  },
  'articles.views':      { en: '{n} views',        hi: '{n} बार देखा गया'  },
  'articles.share':      { en: 'Share',            hi: 'साझा करें'         },
  'articles.shareGroup': { en: 'Share this article', hi: 'यह लेख साझा करें' },

  // ── Missions ─────────────────────────────────────────────────
  'missions.eyebrow':    { en: 'Mission Tracking',  hi: 'मिशन ट्रैकिंग'     },
  'missions.title':      { en: 'Space Missions',    hi: 'अंतरिक्ष मिशन'     },
  'missions.lede':       { en: 'Active, upcoming, and historic missions across all major space agencies — tracked in one place.', hi: 'सभी प्रमुख अंतरिक्ष एजेंसियों के सक्रिय, आगामी और ऐतिहासिक मिशन — एक ही जगह।' },
  'missions.empty':      { en: 'No missions found.', hi: 'कोई मिशन नहीं मिला।' },
  'missions.emptyStatus':{ en: 'No missions with this status.', hi: 'इस स्थिति का कोई मिशन नहीं है।' },
  'missions.endOne':     { en: 'You’ve reached the end · {n} mission',  hi: 'आप अंत तक पहुँच गए · {n} मिशन' },
  'missions.endMany':    { en: 'You’ve reached the end · {n} missions', hi: 'आप अंत तक पहुँच गए · {n} मिशन' },
  'missions.back':       { en: '← All Missions',    hi: '← सभी मिशन'       },
  'missions.related':    { en: 'Related Missions',  hi: 'संबंधित मिशन'      },
  'missions.crumb':      { en: 'Missions',          hi: 'मिशन'             },
  'missions.filterAll':  { en: 'All',               hi: 'सभी'              },
  'missions.filterActive':    { en: 'Active',         hi: 'सक्रिय'         },
  'missions.filterUpcoming':  { en: 'Upcoming',       hi: 'आगामी'          },
  'missions.filterDev':       { en: 'In Development', hi: 'विकासाधीन'      },
  'missions.filterCompleted': { en: 'Completed',      hi: 'पूर्ण'           },

  // ── Learn ────────────────────────────────────────────────────
  'learn.eyebrow':       { en: 'Knowledge Layer',   hi: 'ज्ञान परत'         },
  'learn.title':         { en: 'Learn Space Science', hi: 'अंतरिक्ष विज्ञान सीखें' },
  'learn.lede':          { en: 'Deep-dive articles on orbital mechanics, astrophysics, and the mathematics powering space exploration. From beginner introductions to advanced physics.', hi: 'कक्षीय यांत्रिकी, खगोल भौतिकी और अंतरिक्ष अन्वेषण के पीछे के गणित पर विस्तृत लेख — शुरुआती परिचय से उन्नत भौतिकी तक।' },
  'learn.empty':         { en: 'NO ARTICLES YET',   hi: 'अभी कोई लेख नहीं'  },
  'learn.countOne':      { en: '{n} article',       hi: '{n} लेख'          },
  'learn.countMany':     { en: '{n} articles',      hi: '{n} लेख'          },
  'learn.readArticle':   { en: 'Read article →',    hi: 'लेख पढ़ें →'       },
  'learn.featured':      { en: 'Featured',          hi: 'विशेष'            },
  'learn.back':          { en: '← Back to Learn',   hi: '← सीखें पर वापस'   },
  // The footer link on a learn article. Its English wording says "Articles"
  // while pointing at the Learn listing — kept as-is so this change does not
  // silently reword the English site; the Hindi says what it actually does.
  'learn.allArticles':   { en: '← All Articles',    hi: '← सभी पाठ'        },
  'learn.filterAll':     { en: 'All',               hi: 'सभी'              },
  'learn.beginner':      { en: 'Beginner',          hi: 'शुरुआती'          },
  'learn.intermediate':  { en: 'Intermediate',      hi: 'मध्यम'            },
  'learn.advanced':      { en: 'Advanced',          hi: 'उन्नत'            },
} satisfies Record<string, Entry>

export type UIKey = keyof typeof UI

/**
 * A chrome string in `lang`, with `{name}` placeholders filled from `vars`.
 *
 * Falls back to English rather than rendering the key: a missing translation
 * should look like an untranslated site, not a broken one.
 */
export function t(
  key: UIKey,
  lang: LanguageCode,
  vars?: Record<string, string | number>,
): string {
  const entry = UI[key] as Entry
  let out = entry[lang] || entry[DEFAULT_LANGUAGE]
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.replaceAll(`{${name}}`, String(value))
    }
  }
  return out
}

/**
 * `t` with the language already bound — what components use, so a call reads
 * `ui('learn.title')` rather than repeating `lang` on every line.
 */
export function strings(lang: LanguageCode) {
  return (key: UIKey, vars?: Record<string, string | number>) => t(key, lang, vars)
}

/**
 * A nav entry's label in `lang`.
 *
 * Lives here rather than in `config/navigation.ts` because that file stays
 * import-free (see its header); this is where the loosely-typed `labels` map
 * meets `LanguageCode`. Falls back to the English `label`, so an entry added
 * without a translation renders in English instead of leaving a hole.
 */
export function navLabel(
  item: { label: string; labels?: Record<string, string> },
  lang: LanguageCode,
): string {
  if (lang === DEFAULT_LANGUAGE) return item.label
  return item.labels?.[lang] || item.label
}

/** Count-aware lookup: English needs the plural, Hindi uses one form for both. */
export function tCount(
  n: number,
  one: UIKey,
  many: UIKey,
  lang: LanguageCode,
): string {
  return t(n === 1 ? one : many, lang, { n })
}
