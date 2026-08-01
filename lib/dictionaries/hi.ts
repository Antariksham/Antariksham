// Hindi (हिन्दी) UI strings.
//
// Typed as `Dictionary`, so every key in en.ts must appear here — omit one and
// the build fails, naming the missing key. That is deliberate: it makes "we
// forgot to translate the new label" a compile error instead of a bug a Hindi
// reader finds in production.
//
// TRANSLATION NOTES:
//  • Devanagari has no uppercase. Several of these render in slots that apply
//    `text-transform: uppercase` + `letter-spacing` for English; both are
//    neutralised under `:lang(hi)` in styles/globals.css, because letter-spacing
//    breaks conjuncts and detaches matras from their base glyph.
//  • Proper nouns stay in their conventional Hindi transliteration (नासा, आईएसएस)
//    rather than being translated — that is how Hindi science press writes them.

import type { Dictionary } from './en'

export const hi: Dictionary = {
  // ── Global navigation ──────────────────────────────────────────────────────
  'nav.articles':   'लेख',
  'nav.explore':    'अन्वेषण',
  'nav.live':       'लाइव',
  'nav.learn':      'सीखें',
  'nav.gallery':    'गैलरी',
  'nav.about':      'परिचय',
  'nav.search':     'खोज',
  'nav.home':       'होम',
  'nav.openMenu':   'मेन्यू खोलें',
  'nav.closeMenu':  'मेन्यू बंद करें',

  // ── Footer ─────────────────────────────────────────────────────────────────
  'footer.platform':        'प्लेटफ़ॉर्म',
  'footer.intelligence':    'लाइव डेटा',
  'footer.organization':    'संस्था',
  'footer.issTracker':      'आईएसएस ट्रैकर',
  'footer.launchSchedule':  'प्रक्षेपण कार्यक्रम',
  'footer.deepSpace':       'गहन अंतरिक्ष',
  'footer.lunarSim':        'चंद्र लैंडर सिम्युलेटर',
  'footer.apod':            'नासा एपीओडी',
  'footer.allMissions':     'सभी मिशन',
  'footer.editorialPolicy': 'संपादकीय नीति',
  'footer.sources':         'स्रोत',
  'footer.contact':         'संपर्क',
  'footer.ourMission':      'हमारा उद्देश्य',
  'footer.privacy':         'गोपनीयता नीति',
  'footer.terms':           'नियम व शर्तें',

  // ── Brand copy ─────────────────────────────────────────────────────────────
  'site.tagline':     'स्वतंत्र अंतरिक्ष जानकारी और ज्ञान प्लेटफ़ॉर्म',
  'site.positioning': 'स्वतंत्र अंतरिक्ष जानकारी संस्था',
  'site.description': 'वैज्ञानिक पत्रकारिता, लाइव मिशन ट्रैकिंग, गहन-अंतरिक्ष टेलीमेट्री और एक शैक्षिक ज्ञान इंजन — सब कुछ एक स्वतंत्र प्लेटफ़ॉर्म पर।',

  // ── Language switch ────────────────────────────────────────────────────────
  'lang.choose': 'भाषा चुनें',
}
