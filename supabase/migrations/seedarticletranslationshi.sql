-- =============================================================================
-- Seed Hindi (hi) translations for the 5 test articles — Antariksham
-- Paste into the Supabase Dashboard → SQL Editor → New query → Run.
--
-- PREREQUISITES:
--   1. Run migration  supabase/migrations/20260722180000_article_translations.sql
--      first (this needs the article_translations table + its unique index).
--   2. The articles must exist. These rows match test/seed-articles.sql; run that
--      first if you don't already have those articles. (Rows whose slug isn't in
--      your DB are simply skipped by the JOIN — nothing breaks.)
--
-- Idempotent: re-running UPDATES the translation (upsert on article_id+language).
-- All rows are is_published = true, so they show to readers immediately at
--   /hi/articles/<slug>   (and the English page gets an "English | हिन्दी" toggle).
-- The English article is untouched — same slug, same shared view counter.
-- =============================================================================

insert into public.article_translations
  (article_id, language_code, title, excerpt, content, is_published)
select a.id, 'hi', v.title, v.excerpt, v.content, true
from (values
  (
    'webb-record-breaking-galaxy',
    'जेम्स वेब ने खोजी रिकॉर्ड तोड़ने वाली सबसे दूर की आकाशगंगा',
    'JWST ने एक बार फिर ब्रह्मांड की सीमा को आगे बढ़ाया, अब तक की सबसे दूर पुष्ट आकाशगंगा की तस्वीर ली।',
    '<p>जेम्स वेब स्पेस टेलीस्कोप ने एक ऐसी आकाशगंगा की पुष्टि की है जिसका प्रकाश बिग बैंग के महज कुछ सौ मिलियन वर्ष बाद उससे निकला था।</p><p>खगोलविदों का कहना है कि यह खोज इस बात के मॉडल को नया रूप देती है कि पहली आकाशगंगाएँ कितनी तेज़ी से बनीं।</p>'
  ),
  (
    'artemis-ii-new-date',
    'नासा ने आर्टेमिस II की मानवयुक्त चंद्र-परिक्रमा के लिए नई तारीख तय की',
    '50 से अधिक वर्षों में चंद्रमा के चारों ओर पहले मानवयुक्त मिशन को नई प्रक्षेपण अवधि मिली।',
    '<p>नासा ने आर्टेमिस II के लिए एक संशोधित लक्ष्य अवधि की घोषणा की है, जो ओरायन अंतरिक्ष यान की चंद्रमा के चारों ओर पहली मानवयुक्त उड़ान है।</p><p>यह मिशन इस दशक के अंत में होने वाली मानवयुक्त लैंडिंग का अग्रदूत है।</p>'
  ),
  (
    'spacex-booster-25th-reuse',
    'स्पेसएक्स ने एक बूस्टर का 25वीं बार पुनः उपयोग किया',
    'एक ही फाल्कन 9 प्रथम चरण ने एक स्टारलिंक उड़ान पर पुनः उपयोग का नया रिकॉर्ड बनाया।',
    '<p>स्पेसएक्स ने एक फाल्कन 9 बूस्टर को 25वीं बार उड़ाया और बरामद किया, जिससे पुनः प्रयोज्य रॉकेट तकनीक में उसकी बढ़त और मज़बूत हुई।</p><p>तेज़ पुनः उपयोग कक्षा तक पहुँच की लागत को लगातार कम कर रहा है।</p>'
  ),
  (
    'europa-hidden-ocean-clues',
    'एक छिपी हुई महासागरीय दुनिया? यूरोपा से नए संकेत',
    'नए आँकड़े यूरोपा की बर्फीली सतह के नीचे से निकलती जलधाराओं (प्लूम) का संकेत देते हैं।',
    '<p>पुरालेखीय और नए प्रेक्षणों का विश्लेषण करने वाले वैज्ञानिकों ने बृहस्पति के चंद्रमा यूरोपा पर जलवाष्प के प्लूम के नए प्रमाण बताए हैं।</p><p>ये निष्कर्ष एक रहने योग्य उपसतही महासागर के पक्ष को और मज़बूत करते हैं।</p>'
  ),
  (
    'how-ion-engines-work',
    'आयन इंजन कैसे चुपचाप गहरे अंतरिक्ष मिशनों को शक्ति देते हैं',
    'वे साधारण-से दिखने वाले थ्रस्टर जो प्रोब को पूरे सौरमंडल में धकेलते हैं — सरल भाषा में समझाया।',
    '<p>आयन प्रणोदन बहुत कम थ्रस्ट पैदा करता है पर महीनों तक चलता है, जिससे अंतरिक्ष यान ऐसी गति तक पहुँच पाते हैं जिन्हें रासायनिक रॉकेट कुशलता से नहीं दे सकते।</p><p>हम समझाते हैं कि ये कैसे काम करते हैं और क्यों महत्वपूर्ण हैं।</p>'
  )
) as v(slug, title, excerpt, content)
join public.articles a on a.slug = v.slug
on conflict (article_id, language_code) do update
  set title        = excluded.title,
      excerpt      = excluded.excerpt,
      content      = excluded.content,
      is_published = excluded.is_published,
      updated_at   = now();

-- Confirm what landed --------------------------------------------------------
select a.slug,
       t.language_code,
       t.is_published,
       left(t.title, 48) as hi_title
from public.article_translations t
join public.articles a on a.id = t.article_id
where t.language_code = 'hi'
order by a.published_at desc;

-- =============================================================================
-- FALLBACK — if you DON'T have the test articles above and just want to see the
-- mechanism on whatever your newest published article is, run ONLY this block
-- instead (uncomment it). It writes a placeholder Hindi translation so you can
-- verify the toggle + Devanagari rendering; replace the text via the admin
-- editor's हिन्दी tab afterwards.
-- =============================================================================
-- insert into public.article_translations
--   (article_id, language_code, title, excerpt, content, is_published)
-- select id, 'hi',
--        'हिन्दी अनुवाद — ' || title,
--        'यह एक परीक्षण हिन्दी सारांश है।',
--        '<p>यह एक परीक्षण हिन्दी अनुवाद है। असली अनुवाद एडमिन पैनल के हिन्दी टैब से लिखें।</p>',
--        true
-- from public.articles
-- where status = 'published'
-- order by published_at desc nulls last
-- limit 1
-- on conflict (article_id, language_code) do update
--   set title = excluded.title, excerpt = excluded.excerpt,
--       content = excluded.content, is_published = excluded.is_published,
--       updated_at = now();
