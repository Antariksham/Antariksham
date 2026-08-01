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

  // ── Per-page metadata ──────────────────────────────────────────────────────
  'page.home.title':  'अंतरिक्षम् — अंतरिक्ष जानकारी और ज्ञान मंच',
  'page.home.desc':   'वैज्ञानिक पत्रकारिता, लाइव मिशन ट्रैकिंग, गहन-अंतरिक्ष टेलीमेट्री और एक शैक्षिक ज्ञान इंजन — सब कुछ एक स्वतंत्र प्लेटफ़ॉर्म पर।',

  'page.learn.title': 'सीखें',
  'page.learn.desc':  'कक्षीय यांत्रिकी, खगोल भौतिकी, ब्लैक होल, सापेक्षता और अंतरिक्ष अन्वेषण के पीछे के गणित पर विस्तृत लेख।',

  'page.missions.title': 'अंतरिक्ष मिशन',
  'page.missions.desc':  'नासा, इसरो, स्पेसएक्स, ईएसए और सभी प्रमुख एजेंसियों के सक्रिय, आगामी और ऐतिहासिक अंतरिक्ष मिशन — एक ही जगह।',

  'page.articles.title': 'लेख',
  'page.articles.desc':  'नासा, इसरो, स्पेसएक्स, ईएसए और अन्य से अंतरिक्ष लेख, मिशन अपडेट और वैज्ञानिक खोजें।',

  'page.about.title': 'परिचय',
  'page.about.desc':  'अंतरिक्षम् एक स्वतंत्र अंतरिक्ष जानकारी और ज्ञान मंच है, जो वैज्ञानिक पत्रकारिता, लाइव मिशन ट्रैकिंग और गहन शैक्षिक सामग्री को एक साथ लाता है।',

  'page.contact.title': 'संपर्क',
  'page.contact.desc':  'अंतरिक्षम् टीम से संपर्क करें — सुधार, सुझाव, सहयोग या सामान्य पूछताछ के लिए।',

  'page.privacy.title': 'गोपनीयता नीति',
  'page.privacy.desc':  'अंतरिक्षम् की गोपनीयता नीति — हम कौन-सा डेटा एकत्र करते हैं, उसका उपयोग कैसे करते हैं, और आपके अधिकार क्या हैं।',

  'page.terms.title': 'नियम व शर्तें',
  'page.terms.desc':  'अंतरिक्षम् के उपयोग पर लागू होने वाले नियम और शर्तें।',

  'page.sources.title': 'स्रोत',
  'page.sources.desc':  'वे प्राथमिक स्रोत, एपीआई और डेटा प्रदाता जिन पर अंतरिक्षम् की पत्रकारिता, लाइव डेटा और शैक्षिक सामग्री आधारित है।',

  'page.editorialPolicy.title': 'संपादकीय नीति',
  'page.editorialPolicy.desc':  'अंतरिक्षम् के संपादकीय मानक, स्रोत नीति, सुधार प्रक्रिया और प्रकाशन दिशानिर्देश।',

  'page.ourMission.title': 'हमारा उद्देश्य',
  'page.ourMission.desc':  'अंतरिक्षम् के पीछे का दर्शन और दीर्घकालिक दृष्टि — हमने इसे क्यों बनाया, हम किसके लिए खड़े हैं, और हम कहाँ जा रहे हैं।',

  'page.search.title': 'खोज',
  'page.search.desc':  'अंतरिक्षम् पर लेख, मिशन और अंतरिक्ष विज्ञान के विषय खोजें।',

  'page.gallery.title': 'गैलरी',
  'page.gallery.desc':  'नासा और दुनिया की प्रमुख वेधशालाओं की अंतरिक्ष तस्वीरें — नीहारिकाएँ, आकाशगंगाएँ, ग्रह और मिशन फ़ोटोग्राफ़ी।',

  'page.apod.title': 'एपीओडी संग्रह',
  'page.apod.desc':  'नासा की "दिन की खगोल तस्वीर" का संग्रह, पूरे विवरण के साथ देखें।',

  'page.live.title': 'लाइव',
  'page.live.desc':  'लाइव अंतरिक्ष जानकारी प्रणालियाँ — आईएसएस ट्रैकर, प्रक्षेपण काउंटडाउन, नासा एपीओडी और गहन अंतरिक्ष टेलीमेट्री।',

  'page.issTracker.title': 'आईएसएस लाइव ट्रैकर',
  'page.issTracker.desc':  'अंतर्राष्ट्रीय अंतरिक्ष स्टेशन को वास्तविक समय में ट्रैक करें। लाइव स्थिति, ऊँचाई, गति और वर्तमान चालक दल।',

  'page.launches.title': 'प्रक्षेपण ट्रैकर',
  'page.launches.desc':  'लाइव रॉकेट प्रक्षेपण ट्रैकर। आगामी और हालिया प्रक्षेपण, काउंटडाउन टाइमर, प्रक्षेपण विंडो और लाइवस्ट्रीम लिंक के साथ।',

  'page.deepSpace.title': 'गहन अंतरिक्ष ट्रैकर',
  'page.deepSpace.desc':  'वॉयजर 1, वॉयजर 2, पार्कर सोलर प्रोब, यूरोपा क्लिपर और लूसी की लाइव टेलीमेट्री।',

  'page.explore.title': 'अन्वेषण',
  'page.explore.desc':  'सौर मंडल, आज रात के आकाश और अंतरिक्ष विज्ञान के विषयों को जोड़ने वाले इंटरैक्टिव उपकरण।',

  'page.skyTonight.title': 'आज रात का आकाश',
  'page.skyTonight.desc':  'आज रात आपके आकाश में क्या दिखेगा — ग्रह, चंद्रमा की कला, और आपके स्थान के लिए आगामी आईएसएस पास।',

  'page.solarSystem.title': 'सौर मंडल अन्वेषक',
  'page.solarSystem.desc':  'सौर मंडल का इंटरैक्टिव मॉडल — ग्रहों की स्थिति, कक्षाएँ, और हर लोक का अन्वेषण करने वाले मिशन।',

  'page.topics.title': 'विषय केंद्र',
  'page.topics.desc':  'चुनिंदा केंद्र जो अंतरिक्ष विज्ञान के हर प्रमुख क्षेत्र के लेख, मिशन और शिक्षण सामग्री एक साथ लाते हैं।',

  'page.lunarSim.title': 'चंद्र लैंडिंग सिम्युलेटर',
  'page.lunarSim.desc':  'अपोलो-शैली की चंद्र लैंडिंग उड़ाएँ — थ्रस्ट, ईंधन और गति संभालें, और सुरक्षित उतरने की कोशिश करें।',
}
