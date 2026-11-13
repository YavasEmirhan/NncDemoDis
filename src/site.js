/* ============ language ============ */
let LANG = (() => { try { return localStorage.getItem(LANG_KEY) === 'tr' ? 'tr' : 'en'; } catch (e) { return 'en'; } })();
const T = (en, tr) => LANG === 'tr' ? tr : en;
const LOC = () => LANG === 'tr' ? 'tr-TR' : 'en-US';
const ft = t => LANG === 'tr' ? t : fmtTime(t);
const fd = (d, o = { weekday: 'short', month: 'short', day: 'numeric' }) => parseD(d).toLocaleDateString(LOC(), { ...o, timeZone: 'UTC' });
const dayName = (i, w = 'long') => new Date(Date.UTC(2024, 0, 7 + i)).toLocaleDateString(LOC(), { weekday: w, timeZone: 'UTC' });
const monShort = d => parseD(d).toLocaleDateString(LOC(), { month: 'short', timeZone: 'UTC' });
const fdShort = d => LANG === 'tr' ? `${dayName(dow(d), 'short')} ${+d.slice(8)} ${monShort(d)}` : fmtDate(d);
const fdLong = d => LANG === 'tr' ? `${+d.slice(8)} ${parseD(d).toLocaleDateString('tr-TR', { month: 'long', timeZone: 'UTC' })} ${dayName(dow(d))}` : fmtDate(d, { weekday: 'long', month: 'long', day: 'numeric' });
const VT_TR = { v_new: 'Yeni hasta muayenesi', v_clean: 'Kontrol ve temizlik', v_consult: 'Konsültasyon', v_urgent: 'Acil muayene' };
const VT_HINT = { v_new: ['Your first time with us', 'Bize ilk kez geliyorsanız'], v_clean: ['Exam and professional cleaning', 'Muayene ve profesyonel temizlik'], v_consult: ['Implants, veneers or a second opinion', 'İmplant, kaplama veya ikinci görüş'], v_urgent: ['Pain, swelling or a broken tooth', 'Ağrı, şişlik veya kırık diş'] };
const vtName = v => v ? (LANG === 'tr' && VT_TR[v.id] ? VT_TR[v.id] : v.name) : '';
const docRole = d => d ? (LANG === 'tr' && d.role_tr ? d.role_tr : d.role) : '';
const docBio = d => d ? (LANG === 'tr' && d.bio_tr ? d.bio_tr : d.bio) : '';
function setLang(l) { LANG = l === 'tr' ? 'tr' : 'en'; try { localStorage.setItem(LANG_KEY, LANG); } catch (e) { } document.documentElement.lang = LANG; }
function stateText(st) {
  if (st.k === 'until') return T(`Open today until ${fmtTime(st.t)}`, `Bugün açık, kapanış ${st.t}`);
  if (st.k === 'today') return T(`Opens today at ${fmtTime(st.t)}`, `Bugün açılış ${st.t}`);
  if (st.k === 'tomorrow') return T(`Closed now, opens tomorrow at ${fmtTime(st.t)}`, `Şu an kapalı, yarın açılış ${st.t}`);
  if (st.k === 'day') return T(`Closed now, opens ${DAYS[st.day]} at ${fmtTime(st.t)}`, `Şu an kapalı, ${dayName(st.day)} açılış ${st.t}`);
  return T('Closed now', 'Şu an kapalı');
}

/* ============ shared ui ============ */
const root = () => $('#root'), layer = () => $('#layer');
function toast(m) { const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = m; $('#toasts').appendChild(el); setTimeout(() => el.remove(), 4000); }
function closeLayer() { layer().innerHTML = ''; document.body.style.overflow = ''; AV.drawer = null; }
function download(name, text, type) { const b = new Blob([text], { type }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
const addr = () => { const S = DB.settings; return `${S.street}, ${S.city}, ${S.state} ${S.zip}`; };
const mq = () => encodeURIComponent(`${DB.settings.clinicName}, ${addr()}`);
const tel = () => 'tel:+1' + digits(DB.settings.phone).slice(-10);
const avatar = d => d && d.photo ? `<span class="avatar"><img src="${d.photo}" alt=""></span>` : `<span class="avatar" style="background:${d ? d.color : 'var(--muted)'}">${esc(initials(d ? d.name : '?'))}</span>`;
const badge = s => `<span class="badge st-${s}">${STATUS[s]}</span>`;
const logo = en => `<b>${esc(DB.settings.shortName)}</b><span>${en || LANG === 'en' ? 'Implant &amp; Integrative Dentistry' : 'İmplant ve Bütüncül Diş Hekimliği'}</span>`;
const STAR = '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 1.6l2.5 5.3 5.8.7-4.3 4 1.1 5.8L10 14.6l-5.1 2.8L6 11.6l-4.3-4 5.8-.7z"/></svg>';
const stars = () => `<span class="stars" aria-hidden="true">${STAR.repeat(5)}</span>`;
// Stock photos (Unsplash licence). Placeholders until the practice supplies its own photos.
const IMG = { hero: '1704455306251-b4634215d98f', implants: '1777444270707-850bfe730c10', everyday: '1553691158-91a7f9183156', refine: '1677026010083-78ec7f1b84ed', office: '1629909613654-28e377c37b09' };
const photo = (k, w, h, alt = '', eager) => `<img src="https://images.unsplash.com/photo-${IMG[k]}?auto=format&fit=crop&w=${w}&h=${h}&q=70" alt="${esc(alt)}" ${eager ? '' : 'loading="lazy"'} onerror="this.remove()">`;
const dayLabel = d => { const n = nowParts().date; return d === n ? T('Today', 'Bugün') : d === addDays(n, 1) ? T('Tomorrow', 'Yarın') : fdShort(d); };

/* ============ care pages ============ */
const SERVICES = [
  { slug: 'dental-implants', img: 'implants', vt: 'v_consult',
    en: { name: 'Dental implants', title: 'Dental implants in Arlington Heights', cta: 'Book an implant consultation',
      lede: 'An implant replaces a missing tooth from the root up, so the new tooth is anchored in your jaw instead of resting on its neighbours.',
      what: 'A dental implant is a small post placed in the jawbone where a tooth is missing. Once the bone has healed around it, a crown is attached on top. Implants can replace one tooth, several teeth, or hold a denture in place.',
      who: ['You are missing one or more teeth', 'A bridge or denture no longer fits well', 'You would rather not grind down healthy teeth for a bridge', 'Your gums are healthy, or can be treated first'],
      steps: [['Consultation', 'We look at your teeth, gums and bite, take the images we need and talk through your options.'], ['A written plan', 'The steps, the timing and the cost, before anything starts.'], ['Placement', 'The implant is placed with local anesthesia.'], ['Healing', 'Over the following months the bone bonds with the implant.'], ['Your new tooth', 'A crown made to match your other teeth is attached to the implant.']],
      cost: 'The cost depends on how many teeth are replaced and whether extra steps such as bone grafting are needed. You get a written estimate first, and we can check what your dental insurance covers.',
      faq: [['Does getting an implant hurt?', 'The area is numbed during placement. Most people describe the following days as sore rather than painful, and we tell you what to expect for your case.'], ['How long does the whole process take?', 'It depends on your bone and gums. You get a timeline at your consultation.'], ['Am I too old for an implant?', 'Age alone is rarely the deciding factor. Your general health, gums and bone matter more, and we look at all three.']] },
    tr: { name: 'Diş implantı', title: "Arlington Heights'ta diş implantı", cta: 'İmplant konsültasyonu alın',
      lede: 'İmplant eksik dişi kökünden itibaren yeniler. Yeni diş yanındaki dişlere dayanmaz, çene kemiğine sabitlenir.',
      what: 'Diş implantı, dişin eksik olduğu yere çene kemiğine yerleştirilen küçük bir vidadır. Kemik çevresinde iyileştikten sonra üzerine kron takılır. İmplantla tek bir diş, birkaç diş yenilenebilir veya bir protez sabitlenebilir.',
      who: ['Bir veya birkaç dişiniz eksikse', 'Köprünüz veya protezeniz artık iyi oturmuyorsa', 'Köprü için sağlam dişlerin kesilmesini istemiyorsanız', 'Diş etleriniz sağlıklıysa veya önce tedavi edilebilecekse'],
      steps: [['Konsültasyon', 'Dişlerinize, diş etlerinize ve kapanışınıza bakar, gereken görüntüleri alır ve seçenekleri konuşuruz.'], ['Yazılı plan', 'Adımlar, süre ve ücret, hiçbir işleme başlamadan önce.'], ['Yerleştirme', 'İmplant lokal anestezi ile yerleştirilir.'], ['İyileşme', 'Sonraki aylarda kemik implantla kaynaşır.'], ['Yeni dişiniz', 'Diğer dişlerinize uygun yapılan kron implantın üzerine takılır.']],
      cost: 'Ücret, yenilenecek diş sayısına ve kemik grefti gibi ek işlemlere gerek olup olmadığına göre değişir. Önce yazılı bir fiyat alırsınız; sigortanızın neyi karşıladığını da kontrol edebiliriz.',
      faq: [['İmplant yaptırmak acıtır mı?', 'Yerleştirme sırasında bölge uyuşturulur. Çoğu kişi sonraki günleri ağrılı değil hassas diye anlatıyor. Sizin durumunuzda ne beklemeniz gerektiğini önceden söyleriz.'], ['Tüm süreç ne kadar sürer?', 'Kemik ve diş eti durumunuza bağlı. Konsültasyonda size bir zaman planı veririz.'], ['İmplant için yaşım geçti mi?', 'Tek başına yaş nadiren belirleyicidir. Genel sağlığınız, diş etleriniz ve kemiğiniz daha önemli; üçüne de bakarız.']] } },
  { slug: 'checkups-and-cleanings', img: 'everyday', vt: 'v_clean',
    en: { name: 'Checkups and cleanings', title: 'Checkups and cleanings', cta: 'Book a checkup',
      lede: 'A regular visit to keep small problems small: an exam, a professional cleaning and time for your questions.',
      what: 'At a checkup we examine your teeth, gums and bite, clean away the plaque and tartar that brushing misses, and take X-rays only when they are due. We also look at your gums and mouth as part of your overall health.',
      who: ['It has been a while since your last cleaning', 'Your gums bleed when you brush', 'You are new to the area and need a dentist', 'You would like a second look at an earlier diagnosis'],
      steps: [['Health check-in', 'We ask about your health and anything you have noticed.'], ['Exam', 'Teeth, gums, bite and soft tissues, with X-rays only when needed.'], ['Cleaning', 'Plaque and tartar are removed and your teeth are polished.'], ['Next steps', 'We explain what we found and when to come back.']],
      cost: 'Many dental insurance plans include regular checkups and cleanings. Call us with your plan details and we will tell you what to expect.',
      faq: [['How often should I come in?', 'Many people come twice a year. Depending on your gums, we may suggest a different interval.'], ['Do I need X-rays every time?', 'No. We take X-rays only when they are due or when we need a closer look.']] },
    tr: { name: 'Kontrol ve temizlik', title: 'Kontrol ve diş temizliği', cta: 'Kontrol randevusu alın',
      lede: 'Küçük sorunları küçükken yakalamak için düzenli ziyaret: muayene, profesyonel temizlik ve sorularınız için zaman.',
      what: 'Kontrolde dişlerinizi, diş etlerinizi ve kapanışınızı muayene eder, fırçanın ulaşamadığı plak ve diş taşını temizleriz. Röntgeni yalnızca zamanı geldiğinde çekeriz. Ağız sağlığınızı genel sağlığınızın bir parçası olarak değerlendiririz.',
      who: ['Son temizliğinizin üzerinden uzun zaman geçtiyse', 'Fırçalarken diş etleriniz kanıyorsa', 'Bölgeye yeni taşındıysanız ve diş hekimi arıyorsanız', 'Daha önce konulan bir teşhise ikinci kez bakılmasını istiyorsanız'],
      steps: [['Sağlık görüşmesi', 'Sağlığınızı ve fark ettiğiniz şeyleri konuşuruz.'], ['Muayene', 'Dişler, diş etleri, kapanış ve yumuşak dokular; röntgen sadece gerekirse.'], ['Temizlik', 'Plak ve diş taşı temizlenir, dişleriniz parlatılır.'], ['Sonraki adımlar', 'Ne bulduğumuzu ve ne zaman tekrar gelmeniz gerektiğini anlatırız.']],
      cost: 'Birçok diş sigortası düzenli kontrol ve temizliği kapsar. Poliçe bilgilerinizle bizi arayın, ne beklemeniz gerektiğini söyleyelim.',
      faq: [['Ne sıklıkla gelmeliyim?', 'Çoğu kişi yılda iki kez gelir. Diş eti durumunuza göre farklı bir aralık önerebiliriz.'], ['Her seferinde röntgen gerekir mi?', 'Hayır. Röntgeni sadece zamanı geldiğinde veya daha yakından bakmamız gerektiğinde çekeriz.']] } },
  { slug: 'fillings-and-crowns', img: 'refine', vt: 'v_consult',
    en: { name: 'Fillings and crowns', title: 'Fillings and crowns', cta: 'Book a consultation',
      lede: 'Repair a cavity, a crack or a worn filling with tooth-colored materials, keeping as much of your natural tooth as possible.',
      what: 'A filling repairs a small area of decay or damage. When a tooth is weakened by a large cavity, a crack or a root canal, a crown covers and protects the whole tooth. We choose the smallest repair that will last.',
      who: ['A tooth is sensitive to cold or sweets', 'A filling has worn, chipped or fallen out', 'A tooth is cracked or broken', 'A tooth has had a root canal'],
      steps: [['Exam', 'We find the cause and show you what we see.'], ['Your options', 'Filling, onlay or crown, with the pros and cost of each.'], ['Treatment', 'The tooth is numbed, repaired and shaped to fit your bite.'], ['Check', 'We check your bite and make sure everything feels right.']],
      cost: 'You get a cost estimate before treatment. Fillings and crowns are often partly covered by dental insurance.',
      faq: [['Are tooth-colored fillings strong enough?', 'Modern composite materials hold up well for most fillings. For large repairs we may suggest an onlay or a crown instead.'], ['How many visits does a crown take?', 'It depends on the tooth and the material. We tell you at your exam.']] },
    tr: { name: 'Dolgu ve kron', title: 'Dolgu ve kron (kaplama)', cta: 'Konsültasyon alın',
      lede: 'Çürük, çatlak veya yıpranmış dolguyu diş renginde malzemeyle onarıyoruz ve doğal dişinizi olabildiğince koruyoruz.',
      what: 'Dolgu, küçük bir çürüğü veya hasarı onarır. Diş büyük bir çürük, çatlak veya kanal tedavisi nedeniyle zayıfladıysa kron (kaplama) dişin tamamını sararak korur. Uzun ömürlü olacak en küçük onarımı seçeriz.',
      who: ['Dişiniz soğuğa veya tatlıya hassassa', 'Dolgunuz yıprandı, kırıldı veya düştüyse', 'Dişiniz çatladı veya kırıldıysa', 'Dişinize kanal tedavisi yapıldıysa'],
      steps: [['Muayene', 'Nedeni bulur, gördüğümüzü size gösteririz.'], ['Seçenekler', 'Dolgu, onley veya kron; her birinin artısı ve ücreti.'], ['Tedavi', 'Diş uyuşturulur, onarılır ve kapanışınıza göre şekillendirilir.'], ['Kontrol', 'Kapanışınızı kontrol eder, her şeyin rahat olduğundan emin oluruz.']],
      cost: 'Tedaviden önce fiyat bilgisi alırsınız. Dolgu ve kron masraflarının bir kısmını diş sigortaları çoğu zaman karşılar.',
      faq: [['Diş renginde dolgular yeterince sağlam mı?', 'Günümüzün kompozit malzemeleri çoğu dolgu için dayanıklıdır. Büyük onarımlarda onley veya kron önerebiliriz.'], ['Kron için kaç kez gelmem gerekir?', 'Dişe ve malzemeye göre değişir. Muayenede size söyleriz.']] } },
  { slug: 'root-canal-treatment', img: 'office', vt: 'v_consult',
    en: { name: 'Root canal treatment', title: 'Root canal treatment', cta: 'Book a consultation',
      lede: 'Save a tooth that is infected or badly damaged, and stop the pain that comes with it.',
      what: 'Inside each tooth is soft tissue called the pulp. When it becomes infected or inflamed, root canal treatment removes it, cleans the inside of the tooth and seals it. The tooth usually needs a crown afterwards. If a tooth needs a specialist, we refer you to one.',
      who: ['Lasting tooth pain, especially when you bite or at night', 'Sensitivity to hot or cold that does not go away', 'Swelling or a pimple-like bump on the gum', 'A tooth that has darkened'],
      steps: [['Diagnosis', 'An exam and X-ray show whether the pulp is affected.'], ['Treatment', 'The tooth is numbed, cleaned inside and sealed.'], ['Protection', 'A filling or crown restores the tooth so you can use it normally.']],
      cost: 'You get an estimate before treatment starts. Many dental plans cover part of root canal treatment.',
      faq: [['Is a root canal painful?', 'The tooth is numbed, and the treatment is meant to relieve pain. Some tenderness for a few days is common.'], ['Can the tooth be pulled instead?', 'Sometimes. We explain both options, including what replacing the tooth later would involve.']] },
    tr: { name: 'Kanal tedavisi', title: 'Kanal tedavisi', cta: 'Konsültasyon alın',
      lede: 'İltihaplanmış veya ağır hasar görmüş dişi kurtarıyor, beraberindeki ağrıyı dindiriyoruz.',
      what: 'Her dişin içinde pulpa denen yumuşak bir doku vardır. Pulpa iltihaplandığında kanal tedavisiyle temizlenir, dişin içi dezenfekte edilir ve kapatılır. Diş genellikle sonrasında bir kronla korunur. Uzman gerekiyorsa sizi bir uzmana yönlendiririz.',
      who: ['Özellikle ısırırken veya gece geçmeyen diş ağrısı', 'Sıcağa veya soğuğa geçmeyen hassasiyet', 'Diş etinde şişlik veya sivilce benzeri kabarıklık', 'Rengi koyulaşan bir diş'],
      steps: [['Teşhis', 'Muayene ve röntgen pulpanın etkilenip etkilenmediğini gösterir.'], ['Tedavi', 'Diş uyuşturulur, içi temizlenir ve kapatılır.'], ['Koruma', 'Dolgu veya kronla diş eskisi gibi kullanılabilir hale gelir.']],
      cost: 'Tedaviden önce fiyat bilgisi alırsınız. Birçok diş sigortası kanal tedavisinin bir kısmını karşılar.',
      faq: [['Kanal tedavisi acıtır mı?', 'Diş uyuşturulur ve tedavinin amacı ağrıyı dindirmektir. Birkaç gün hassasiyet olması normaldir.'], ['Diş çekilse olmaz mı?', 'Bazen olur. İki seçeneği de, sonradan dişi yenilemenin ne gerektireceğiyle birlikte anlatırız.']] } },
  { slug: 'tooth-extractions', img: 'hero', vt: 'v_consult',
    en: { name: 'Tooth extractions', title: 'Tooth extractions', cta: 'Book a consultation',
      lede: 'When a tooth cannot be saved, we remove it gently and plan what comes next.',
      what: 'We always look for a way to keep a tooth first. If it is too damaged, loose or infected, an extraction may be the best option. Before we begin, we talk about whether and how to replace it. Complex cases may be referred to an oral surgeon.',
      who: ['A tooth is broken below the gum line', 'Severe decay or infection', 'A loose tooth from gum disease', 'A wisdom tooth causing problems'],
      steps: [['Exam and X-ray', 'We check the tooth and the bone around it.'], ['Gentle removal', 'The area is numbed before anything starts.'], ['Aftercare', 'Written instructions, and a number to call with questions.'], ['What comes next', 'Options to replace the tooth, such as an implant.']],
      cost: 'You get an estimate before treatment.',
      faq: [['How long does healing take?', 'Most people feel better within a few days. You get aftercare instructions for your case.'], ['Should I replace the tooth?', 'Often yes, so the teeth around it do not shift. We explain the options so you can decide.']] },
    tr: { name: 'Diş çekimi', title: 'Diş çekimi', cta: 'Konsültasyon alın',
      lede: 'Diş kurtarılamıyorsa nazikçe çeker ve sonrasını birlikte planlarız.',
      what: 'Her zaman önce dişi korumanın bir yolunu ararız. Diş çok hasarlı, sallanıyor veya iltihaplıysa çekim en iyi seçenek olabilir. Başlamadan önce dişin yerine ne konabileceğini konuşuruz. Karmaşık durumlar ağız cerrahına yönlendirilebilir.',
      who: ['Diş eti hizasının altından kırılan diş', 'İleri çürük veya iltihap', 'Diş eti hastalığı nedeniyle sallanan diş', 'Sorun çıkaran yirmilik diş'],
      steps: [['Muayene ve röntgen', 'Dişi ve çevresindeki kemiği kontrol ederiz.'], ['Nazik çekim', 'Başlamadan önce bölge uyuşturulur.'], ['Bakım', 'Yazılı bakım talimatları ve sorularınız için bir telefon numarası.'], ['Sonrası', 'Dişin yerine implant gibi seçenekler.']],
      cost: 'Tedaviden önce fiyat bilgisi alırsınız.',
      faq: [['İyileşme ne kadar sürer?', 'Çoğu kişi birkaç gün içinde kendini iyi hisseder. Size özel bakım talimatı veririz.'], ['Dişin yerine bir şey konmalı mı?', 'Çoğu zaman evet, yoksa yandaki dişler kayabilir. Seçenekleri anlatırız, karar sizin.']] } },
  { slug: 'veneers', img: 'refine', vt: 'v_consult',
    en: { name: 'Veneers', title: 'Veneers', cta: 'Book a consultation',
      lede: 'Change the shape, shade or spacing of your front teeth with thin, custom-made covers.',
      what: 'A veneer is a thin layer of porcelain or composite bonded to the front of a tooth. Veneers can cover chips, small gaps, stains that whitening does not lift, and teeth of uneven size.',
      who: ['Chipped or worn front teeth', 'Small gaps between teeth', 'Stains that whitening does not remove', 'Teeth of uneven size or shape'],
      steps: [['Consultation', 'We talk about what you want to change and check that your teeth and gums are healthy.'], ['Design', 'We plan the shape and shade with you before anything is made.'], ['Fitting', 'The veneers are bonded and adjusted to your bite.']],
      cost: 'Veneers are usually cosmetic, so insurance often does not cover them. You get a clear price before you decide.',
      faq: [['Do veneers damage my teeth?', 'Some enamel is usually removed so the veneer sits naturally. We explain how much for your teeth, and whether a more conservative option exists.'], ['How long do veneers last?', 'With good care, many years. We tell you what to expect for the material you choose.']] },
    tr: { name: 'Lamina (veneer)', title: 'Lamina (veneer) kaplama', cta: 'Konsültasyon alın',
      lede: 'Ön dişlerinizin şeklini, rengini veya aralarını size özel ince kaplamalarla değiştiriyoruz.',
      what: 'Lamina, dişin ön yüzüne yapıştırılan ince bir porselen veya kompozit tabakadır. Kırıkları, küçük aralıkları, beyazlatmayla çıkmayan lekeleri ve boyu farklı dişleri kapatabilir.',
      who: ['Kırık veya aşınmış ön dişler', 'Dişler arasında küçük boşluklar', 'Beyazlatmayla çıkmayan lekeler', 'Boyu veya şekli farklı dişler'],
      steps: [['Konsültasyon', 'Neyi değiştirmek istediğinizi konuşur, diş ve diş etlerinizin sağlıklı olduğunu kontrol ederiz.'], ['Tasarım', 'Şekli ve rengi, hiçbir şey üretilmeden önce sizinle birlikte planlarız.'], ['Uygulama', 'Laminalar yapıştırılır ve kapanışınıza göre ayarlanır.']],
      cost: 'Lamina genellikle estetik bir işlem olduğu için sigorta çoğu zaman karşılamaz. Karar vermeden önce net bir fiyat alırsınız.',
      faq: [['Lamina dişlerime zarar verir mi?', 'Laminanın doğal durması için genellikle bir miktar mine alınır. Sizin dişlerinizde ne kadar gerektiğini ve daha koruyucu bir seçenek olup olmadığını anlatırız.'], ['Laminalar ne kadar dayanır?', 'İyi bakımla uzun yıllar. Seçtiğiniz malzemeye göre ne beklemeniz gerektiğini söyleriz.']] } },
  { slug: 'urgent-dental-care', img: 'office', vt: 'v_urgent', urgent: true,
    en: { name: 'Urgent dental care', title: 'Urgent dental care', cta: 'Book an urgent visit',
      lede: 'Tooth pain, a broken tooth or swelling? Call us during office hours and we will find the earliest time we can see you.',
      what: 'A phone call is the fastest way to be seen when something hurts. You can also book an urgent visit online, and we will call you if we can see you sooner.',
      who: ['A toothache that does not settle', 'A broken or knocked-out tooth', 'A lost filling or crown', 'Swelling in the gum or face'],
      steps: [['Call us', 'Tell us what happened and we find the earliest time.'], ['Relief first', 'We find the cause and treat the pain.'], ['A plan', 'If more treatment is needed, we explain the options.']],
      cost: 'We tell you the cost before treatment.',
      faq: [['A tooth was knocked out. What should I do?', 'Call us right away. Hold the tooth by the crown, not the root, and keep it moist, for example in milk. Time matters.'], ['Can I come in without an appointment?', 'Please call first so we can fit you in and keep your wait short.']] },
    tr: { name: 'Acil diş tedavisi', title: 'Acil diş tedavisi', cta: 'Acil muayene randevusu alın',
      lede: 'Diş ağrısı, kırık diş veya şişlik mi var? Çalışma saatlerinde bizi arayın, sizi görebileceğimiz en yakın saati bulalım.',
      what: 'Bir şey acıdığında en hızlı yol telefon etmek. Online acil muayene randevusu da alabilirsiniz; daha erken görebilirsek sizi ararız.',
      who: ['Geçmeyen diş ağrısı', 'Kırılan veya yerinden çıkan diş', 'Düşen dolgu veya kron', 'Diş etinde veya yüzde şişlik'],
      steps: [['Bizi arayın', 'Ne olduğunu anlatın, en yakın saati bulalım.'], ['Önce rahatlama', 'Nedeni bulur, ağrıyı tedavi ederiz.'], ['Plan', 'Başka tedavi gerekiyorsa seçenekleri anlatırız.']],
      cost: 'Tedaviden önce ücreti söyleriz.',
      faq: [['Dişim yerinden çıktı, ne yapmalıyım?', 'Hemen bizi arayın. Dişi kökünden değil taç kısmından tutun ve nemli tutun, örneğin süt içinde. Zaman önemli.'], ['Randevusuz gelebilir miyim?', 'Lütfen önce arayın ki sizi araya alalım ve az bekleyin.']] } }
];
const svcBySlug = s => SERVICES.find(x => x.slug === s);
const svcHref = s => `#/care/${s}`;
const sv = s => s[LANG] || s.en;
const ER_NOTE = () => T('Go to the nearest emergency room or call 911 if you have swelling that spreads to your eye or neck, trouble breathing or swallowing, or a high fever.', 'Gözünüze veya boynunuza yayılan şişlik, nefes almakta ya da yutkunmakta zorluk veya yüksek ateş varsa en yakın acil servise gidin ya da 911\'i arayın.');

/* ============ public site ============ */
const CARE = [
  { img: 'implants', svc: 'dental-implants', vt: 'v_consult',
    en: { alt: 'Model of a dental implant between two natural teeth', title: 'Dental implants', cta: 'Book an implant consultation', more: 'About dental implants', text: 'A missing tooth changes how you chew and how the teeth around it sit. An implant replaces the root as well as the crown, so it looks and works like a tooth of your own.', items: [['Implant consultation and planning'], ['Replacing one tooth or several'], ['Clear costs before anything begins']] },
    tr: { alt: 'İki doğal diş arasında bir diş implantı modeli', title: 'Diş implantı', cta: 'İmplant konsültasyonu alın', more: 'Diş implantı hakkında', text: 'Eksik bir diş, çiğneme şeklinizi ve yanındaki dişlerin duruşunu değiştirir. İmplant hem kökü hem tacı yeniler; görünüşü ve işlevi kendi dişiniz gibidir.', items: [['İmplant konsültasyonu ve planlama'], ['Tek veya birden fazla dişin yenilenmesi'], ['İşleme başlamadan net fiyat']] } },
  { img: 'everyday', svc: 'checkups-and-cleanings', vt: 'v_clean',
    en: { alt: 'Two bamboo toothbrushes in a glass jar', title: 'Everyday care', cta: 'Book a checkup', more: 'About checkups and cleanings', text: 'Most dental problems are small before they are big. Regular visits keep them small, and give you time to ask about anything you have noticed.', items: [['Checkups and cleanings', 'checkups-and-cleanings'], ['Tooth-colored fillings', 'fillings-and-crowns'], ['Urgent visits when something hurts', 'urgent-dental-care']] },
    tr: { alt: 'Cam kavanozda iki bambu diş fırçası', title: 'Günlük bakım', cta: 'Kontrol randevusu alın', more: 'Kontrol ve temizlik hakkında', text: 'Diş sorunlarının çoğu büyümeden önce küçüktür. Düzenli kontroller onları küçük tutar ve fark ettiğiniz her şeyi sormanıza zaman bırakır.', items: [['Kontrol ve temizlik', 'checkups-and-cleanings'], ['Diş renginde dolgu', 'fillings-and-crowns'], ['Ağrı olduğunda acil muayene', 'urgent-dental-care']] } },
  { img: 'refine', svc: 'fillings-and-crowns', vt: 'v_consult',
    en: { alt: 'Close-up of a smile', title: 'Repair and refine', cta: 'Book a consultation', more: 'About fillings and crowns', text: 'When a tooth is cracked, worn or infected, we look for the most conservative fix that will last, and explain every option before you choose.', items: [['Crowns', 'fillings-and-crowns'], ['Root canal treatment', 'root-canal-treatment'], ['Extractions', 'tooth-extractions'], ['Veneers', 'veneers']] },
    tr: { alt: 'Yakından bir gülümseme', title: 'Onarım ve estetik', cta: 'Konsültasyon alın', more: 'Dolgu ve kron hakkında', text: 'Diş çatladığında, aşındığında veya iltihaplandığında uzun ömürlü en koruyucu çözümü ararız ve siz seçmeden önce her seçeneği anlatırız.', items: [['Kron (kaplama)', 'fillings-and-crowns'], ['Kanal tedavisi', 'root-canal-treatment'], ['Diş çekimi', 'tooth-extractions'], ['Lamina (veneer)', 'veneers']] } }
];
const HOME = { vt: 'v_new' };
function nextSlots(vt, n = 5) {
  const now = nowParts(), out = [];
  for (let i = 0; i <= DB.settings.maxDays && out.length < n; i++) { const d = addDays(now.date, i); for (const s of slotsFor(d, vt, 'any').slice(0, 2)) if (out.length < n) out.push({ d, t: s.time }); }
  return out;
}
const bookHref = (v, d, t) => `#/book?v=${v}${d ? `&d=${d}&t=${t}` : ''}`;
const callBtn = (cls = 'btn--line') => `<a class="btn ${cls}" href="${tel()}">${T('Call', 'Ara')} ${esc(DB.settings.phone)}</a>`;
function bookBtn(label, cls = 'btn--ink', v) { return DB.settings.bookingEnabled ? `<a class="btn ${cls}" href="#/book${v ? '?v=' + v : ''}">${label || T('Book a visit', 'Randevu al')}</a>` : `<a class="btn ${cls}" href="${tel()}">${T('Call to book', 'Randevu için arayın')}</a>`; }
function finderHTML() {
  const S = DB.settings, vts = DB.visitTypes.filter(v => v.active);
  if (!S.bookingEnabled || !vts.length) return `<span class="finder__label">${T('Book by phone', 'Telefonla randevu')}</span><span class="muted" style="flex:1">${T("Online booking is paused. Call us and we'll find a time together.", 'Online randevu şu an kapalı. Bizi arayın, birlikte bir saat bulalım.')}</span>${callBtn('btn--ink btn--sm')}`;
  if (!vts.some(v => v.id === HOME.vt)) HOME.vt = vts[0].id;
  const sl = nextSlots(HOME.vt, 4), st = openState();
  const urgent = HOME.vt === 'v_urgent' ? `<p class="finder__note">${st.open ? T('Office is open now. For pain or swelling, a call is the fastest way to be seen today.', 'Şu an açığız. Ağrı veya şişlikte bugün görülmenin en hızlı yolu telefon.') : T('We are closed right now. Book the earliest time below, or call when we open.', 'Şu an kapalıyız. Aşağıdan en yakın saati seçin veya açılınca arayın.')} <a href="${tel()}">${T('Call', 'Ara')} ${esc(S.phone)}</a></p>` : '';
  return `<label class="finder__label" for="finder-vt">${T('Find a time', 'Saat bul')}</label>
    <select id="finder-vt" data-finder>${vts.map(v => `<option value="${v.id}" ${v.id === HOME.vt ? 'selected' : ''}>${esc(vtName(v))}</option>`).join('')}</select>
    <div class="finder__slots" aria-live="polite">${sl.length ? sl.map(s => `<a class="chip" href="${bookHref(HOME.vt, s.d, s.t)}">${dayLabel(s.d)}, ${ft(s.t)}</a>`).join('') : `<span class="muted">${T('No online openings soon. Please call us.', 'Yakın zamanda online boş saat yok. Lütfen bizi arayın.')}</span>`}</div>
    <a class="finder__all" href="${bookHref(HOME.vt)}">${T('See all times', 'Tüm saatler')}</a>${urgent}`;
}
const langSwitch = () => `<div class="lang" role="group" aria-label="${T('Language', 'Dil')}"><button data-act="lang" data-v="en" aria-pressed="${LANG === 'en'}" lang="en">EN</button><button data-act="lang" data-v="tr" aria-pressed="${LANG === 'tr'}" lang="tr">TR</button></div>`;
function header(simple) {
  const S = DB.settings;
  return `<div class="demo-band" role="note">${T('<b>Demo site.</b> Please use made-up names and numbers only.', '<b>Demo site.</b> Lütfen sadece uydurma isim ve numara kullanın.')}</div>
  <header class="head" id="top"><div class="wrap head__in">
    <a class="logo" href="#/" aria-label="${esc(S.shortName)}">${logo()}</a>
    ${simple ? '<span style="margin-left:auto"></span>' : `<nav class="nav" aria-label="${T('Main', 'Ana menü')}"><a href="#/" data-to="care">${T('Care', 'Tedaviler')}</a><a href="#/" data-to="about">${T('About', 'Hakkımızda')}</a><a href="#/" data-to="visit">${T('Visit', 'Ulaşım')}</a><a href="#/manage">${T('Change a visit', 'Randevum')}</a></nav>`}
    ${langSwitch()}
    <a class="head__tel" href="${tel()}">${esc(S.phone)}</a>
    ${simple ? `<a class="btn btn--line btn--sm head__back" href="#/">${T('Back to site', 'Siteye dön')}</a>` : (S.bookingEnabled ? `<a class="btn btn--mint btn--sm" href="#/book">${T('Book a visit', 'Randevu al')}</a>` : `<a class="btn btn--mint btn--sm" href="${tel()}">${T('Call to book', 'Randevu için arayın')}</a>`)}
    ${simple ? '' : `<button class="menu-btn" data-act="menu" aria-label="${T('Open menu', 'Menüyü aç')}" aria-expanded="false"><span></span><span></span><span></span></button>`}
  </div></header>`;
}
function footer() {
  const S = DB.settings;
  return `<footer class="foot"><div class="wrap">
    <div class="foot__grid">
      <div><a class="logo" href="#/">${logo()}</a><p style="margin-top:16px">${esc(S.clinicName)}<br>${esc(S.doctorLine)}</p></div>
      <div><b>${T('Care', 'Tedaviler')}</b>${SERVICES.map(s => `<a href="${svcHref(s.slug)}">${esc(sv(s).name)}</a>`).join('<br>')}</div>
      <div><b>${T('Visit', 'Adres')}</b>${esc(S.street)}<br>${esc(S.city)}, ${esc(S.state)} ${esc(S.zip)}<br><a href="${tel()}">${esc(S.phone)}</a></div>
      <div><b>${T('Hours', 'Çalışma saatleri')}</b>${WEEK.filter(i => S.hours[i].open).map(i => `${dayName(i, 'short')} ${ft(S.hours[i].start)} ${T('to', '-')} ${ft(S.hours[i].end)}`).join('<br>')}</div>
      <div><b>${T('Patients', 'Hastalar')}</b><a href="#/manage">${T('Change or cancel a visit', 'Randevu değiştir veya iptal et')}</a><br><a href="#/" data-act="placeholder">${T('Notice of Privacy Practices', 'Gizlilik bildirimi')}</a><br><a href="#/" data-act="placeholder">${T('Website privacy policy', 'Web sitesi gizlilik politikası')}</a></div>
    </div>
    <div class="foot__base"><span>© ${nowParts().date.slice(0, 4)} ${esc(S.clinicName)}</span><a href="#/admin">${T('Staff login', 'Personel girişi')}</a></div>
  </div></footer>`;
}
const mbar = () => `<div class="mbar" role="region" aria-label="${T('Quick actions', 'Hızlı işlemler')}"><a class="btn btn--line" href="${tel()}">${T('Call', 'Ara')}</a>${bookBtn(T('Book a visit', 'Randevu al'), 'btn--mint')}</div>`;
function renderHome() {
  const S = DB.settings, st = openState(), doc = DB.doctors.find(d => d.active && d.onSite) || DB.doctors[0], today = dow(nowParts().date);
  const team = DB.doctors.filter(d => d.active && d.onSite && d !== doc);
  const vt0 = (DB.visitTypes.find(v => v.active) || {}).id, first = S.bookingEnabled && vt0 ? nextSlots(vt0, 1)[0] : null;
  const gmaps = `https://www.google.com/maps/search/?api=1&query=${mq()}`, dn = doc ? `${doc.name}, ${doc.title}` : S.doctorLine;
  document.title = T(`${S.shortName} | Dental implants and integrative dentistry in Arlington Heights, IL`, `${S.shortName} | Arlington Heights'ta implant ve bütüncül diş hekimliği`);
  root().innerHTML = `${header()}<main id="main" class="has-mbar">
  <section class="hero"><div class="wrap">
    <div class="hero__grid">
      <div>
        <p class="state ${st.open ? 'is-open' : ''}"><i></i><span>${esc(stateText(st))}</span></p>
        <h1>${T('Calm, careful dentistry in Arlington Heights.', "Arlington Heights'ta sakin ve özenli diş hekimliği.")}</h1>
        <p class="lede">${esc(dn)} ${T('looks after everything from routine cleanings to dental implants, and explains each step before it happens.', 'rutin temizlikten diş implantına kadar her tedaviyi yapıyor ve her adımı başlamadan önce anlatıyor.')}</p>
        <div class="hero__cta">${bookBtn(T('Book a visit', 'Randevu al'), 'btn--mint')}${callBtn()}</div>
        <a class="rating" href="${gmaps}" target="_blank" rel="noopener">${stars()}<span>${T(`<b>${esc(S.rating)} on Google</b>, from ${esc(S.ratingCount)} patient reviews`, `<b>Google'da ${esc(S.rating)}</b>, ${esc(S.ratingCount)} hasta yorumu`)}</span></a>
      </div>
      <figure class="hero__fig">
        <div class="hero__img">${photo('hero', 1100, 1320, T('A bright treatment room with a dental chair', 'Diş ünitesi olan aydınlık bir tedavi odası'), true)}</div>
        <span class="hero__tag">${T('Accepting new patients', 'Yeni hasta kabul ediyoruz')}</span>
        ${first ? `<div class="nextcard"><small>${T('Next opening', 'En yakın boş saat')}</small><b>${dayLabel(first.d)}, ${ft(first.t)}</b><a href="${bookHref(vt0, first.d, first.t)}">${T('Book this time', 'Bu saati al')}</a></div>` : ''}
      </figure>
    </div>
    <div class="finder" id="finder">${finderHTML()}</div>
    <ul class="trust">
      <li><b>${T('Women-owned practice', 'Kadın girişimci muayenehanesi')}</b><span>${T('Led by', 'Yöneten:')} ${esc(doc ? doc.name : '')}</span></li>
      <li><b>${T('English and Turkish', 'İngilizce ve Türkçe')}</b><span>${T('Spoken by our team', 'Ekibimiz iki dili de konuşuyor')}</span></li>
      <li><b>${T('Saturday visits', 'Cumartesi randevu')}</b><span>${S.hours[6].open ? `${ft(S.hours[6].start)} ${T('to', '-')} ${ft(S.hours[6].end)}` : T('Call for weekend hours', 'Hafta sonu için arayın')}</span></li>
      <li><b>${T('Free parking', 'Ücretsiz otopark')}</b><span>${T('Own lot, wheelchair accessible', 'Kendi otoparkımız, tekerlekli sandalye erişimi')}</span></li>
    </ul>
  </div></section>

  <section class="sec" id="care"><div class="wrap">
    <div class="sec__head"><h2>${T("Care for every stage of a tooth's life", 'Dişin her dönemi için bakım')}</h2><p>${T("General, implant and integrative dentistry under one roof. Not sure what you need? Book a new patient visit and we'll work it out together.", 'Genel, implant ve bütüncül diş hekimliği tek çatı altında. Neye ihtiyacınız olduğundan emin değil misiniz? Yeni hasta muayenesi alın, birlikte karar verelim.')}</p></div>
    <div class="care">${CARE.map(c => { const x = c[LANG]; return `<article class="care__row">
      <div class="care__img">${photo(c.img, 1000, 750, x.alt)}</div>
      <div class="care__body"><h3>${x.title}</h3><p>${x.text}</p><ul class="ticks">${x.items.map(([l, s]) => `<li>${s ? `<a href="${svcHref(s)}">${l}</a>` : l}</li>`).join('')}</ul>
        <div class="row-actions">${bookBtn(x.cta, 'btn--line', DB.visitTypes.some(v => v.active && v.id === c.vt) ? c.vt : '')}<a class="more" href="${svcHref(c.svc)}">${x.more}</a></div></div>
    </article>`; }).join('')}</div>
  </div></section>

  <section class="sec sec--oat" id="about"><div class="wrap about__grid">
    <div class="about__panel ${doc && doc.photo ? 'has-photo' : ''}">${doc && doc.photo ? `<img src="${doc.photo}" alt="${esc(doc.name)}">` : `<span class="about__mark" aria-hidden="true"></span><p class="about__say">${T('Explain first.<br>Treat second.', 'Önce anlat.<br>Sonra tedavi et.')}</p><div class="about__who"><b>${esc(dn)}</b><span>${esc(docRole(doc))}</span></div>`}</div>
    <div class="about__body">
      <h2 class="h2">${doc ? T(`Meet ${esc(doc.name)}`, `${esc(doc.name)} ile tanışın`) : T('About the practice', 'Muayenehane hakkında')}</h2>
      <p class="big">${T(`${esc(S.clinicName)} is a women-owned practice on North Arlington Heights Road, led by ${esc(dn)}, an Illinois-licensed dentist.`, `${esc(S.clinicName)}, North Arlington Heights Road üzerinde kadın girişimci tarafından kurulmuş bir muayenehane. Illinois lisanslı diş hekimi ${esc(dn)} tarafından yönetiliyor.`)}</p>
      <p>${esc(docBio(doc))}</p>
      <h3>${T('What integrative dentistry means here', 'Burada bütüncül diş hekimliği ne demek')}</h3>
      <p>${T('Your mouth is part of the rest of you. Gum health, sleep, stress and medications all show up in your teeth, so a plan starts with a conversation about your health, not only an X-ray.', 'Ağzınız vücudunuzun bir parçası. Diş eti sağlığı, uyku, stres ve kullandığınız ilaçlar dişlerinize yansır. Bu yüzden tedavi planı sadece röntgenle değil, sağlığınızla ilgili bir sohbetle başlar.')}</p>
      <ul class="pairs">
        <li><b>${T('You see what we see', 'Gördüğümüzü siz de görürsünüz')}</b><span>${T('We show you what we find and why it matters before you decide anything.', 'Karar vermeden önce ne bulduğumuzu ve neden önemli olduğunu gösteririz.')}</span></li>
        <li><b>${T('Conservative by default', 'Önce koruyucu yaklaşım')}</b><span>${T('Keep as much natural tooth as possible and choose what will last.', 'Doğal dişi olabildiğince korur, uzun ömürlü olanı seçeriz.')}</span></li>
        <li><b>${T('Your whole health counts', 'Genel sağlığınız önemli')}</b><span>${T('Your health history is part of the plan, not a form we file away.', 'Sağlık geçmişiniz dosyalanıp kalan bir form değil, planın bir parçası.')}</span></li>
        <li><b>${T('No rush', 'Acele yok')}</b><span>${T("Questions are welcome. Tell us if you'd like us to slow down.", 'Sorularınızı bekliyoruz. Yavaşlamamızı isterseniz söyleyin.')}</span></li>
      </ul>
      ${team.length ? `<h3>${T('Our team', 'Ekibimiz')}</h3><ul class="pairs">${team.map(x => `<li><b>${esc(x.name)}${x.title ? ', ' + esc(x.title) : ''}</b><span>${esc(docRole(x))}</span></li>`).join('')}</ul>` : ''}
    </div>
  </div></section>

  <section class="sec"><div class="wrap">
    <div class="reviews">
      <div class="reviews__score"><b>${esc(S.rating)}</b>${stars()}<p>${T(`Average rating from ${esc(S.ratingCount)} reviews on Google.`, `Google'daki ${esc(S.ratingCount)} yorumun ortalaması.`)} <a href="${gmaps}" target="_blank" rel="noopener">${T('Read them', 'Yorumları okuyun')}</a></p></div>
      <div class="reviews__grid">
        <div><h3>${T('Seen quickly when it hurts', 'Ağrı olunca hızlı randevu')}</h3><p>${T('Patients describe being fitted in for an urgent visit and leaving out of pain.', 'Hastalar acil durumda araya alındıklarını ve ağrısız çıktıklarını anlatıyor.')}</p></div>
        <div><h3>${T('A gentle hand', 'Nazik bir el')}</h3><p>${T('Reviewers mention how gentle and careful treatment feels, even for nervous patients.', 'Yorumlarda, tedirgin hastalar için bile tedavinin ne kadar nazik ve özenli olduğundan söz ediliyor.')}</p></div>
        <div><h3>${T('Clear explanations', 'Anlaşılır açıklamalar')}</h3><p>${T('People say they finally understood what was going on with their teeth, and the bigger picture.', 'Hastalar dişlerinde neler olduğunu ve genel tabloyu sonunda anladıklarını söylüyor.')}</p></div>
        <p class="reviews__note">${T('A summary of themes from public Google reviews, in our words.', 'Google yorumlarında öne çıkan konuların kendi cümlelerimizle özeti.')}</p>
      </div>
    </div>
  </div></section>

  <section class="sec sec--haze" id="first"><div class="wrap">
    <div class="sec__head"><h2>${T('Your first visit', 'İlk ziyaretiniz')}</h2><p>${T('About an hour, with time for your questions.', 'Sorularınıza da zaman kalacak şekilde yaklaşık bir saat.')}</p></div>
    <ol class="steps">
      <li><b>${T('Book online or call', 'Online randevu alın veya arayın')}</b><span>${T('Pick a time that suits you. We confirm by text or phone.', 'Size uygun saati seçin. Mesajla veya telefonla onaylarız.')}</span></li>
      <li><b>${T('We talk first', 'Önce konuşuruz')}</b><span>${T('Your health history, what brought you in, and what you want from your care.', 'Sağlık geçmişiniz, sizi buraya getiren şey ve tedaviden beklentiniz.')}</span></li>
      <li><b>${T('A careful look', 'Dikkatli bir muayene')}</b><span>${T('Teeth, gums and bite, with X-rays only when they are needed.', 'Dişler, diş etleri ve kapanış; röntgen sadece gerektiğinde.')}</span></li>
      <li><b>${T('A clear plan', 'Net bir plan')}</b><span>${T("Options, timing and costs in plain words. Nothing starts until you're ready.", 'Seçenekler, süre ve ücretler sade bir dille. Siz hazır olmadan hiçbir şey başlamaz.')}</span></li>
    </ol>
  </div></section>

  <section class="sec" id="visit"><div class="wrap">
    <div class="sec__head"><h2>${T('Find us', 'Bize ulaşın')}</h2><p>${T('On North Arlington Heights Road, with our own free parking lot at the door.', 'North Arlington Heights Road üzerinde, kapının önünde ücretsiz otoparkımız var.')}</p></div>
    <div class="visit__grid">
      <div><div class="map" data-empty="${T('Map loads when you are online', 'Harita internete bağlıyken yüklenir')}"><iframe title="${T('Map to', 'Harita:')} ${esc(S.shortName)}" loading="lazy" referrerpolicy="no-referrer" src="https://maps.google.com/maps?q=${mq()}&z=15&output=embed&hl=${LANG}"></iframe></div>
        <form class="route" data-form="route"><label class="sr" for="from">${T('Your starting address', 'Başlangıç adresiniz')}</label><input id="from" name="from" placeholder="${T('Starting from (address or ZIP)', 'Nereden? (adres veya posta kodu)')}"><button class="btn btn--ink" type="submit">${T('Get directions', 'Yol tarifi al')}</button></form></div>
      <div class="vinfo">
        <h3>${esc(S.clinicName)}</h3>
        <address>${esc(S.street)}<br>${esc(S.city)}, ${esc(S.state)} ${esc(S.zip)}<br><a href="${tel()}">${esc(S.phone)}</a></address>
        <div class="btns"><a class="btn btn--line btn--sm" href="https://www.google.com/maps/dir/?api=1&destination=${mq()}" target="_blank" rel="noopener">Google Maps</a><a class="btn btn--line btn--sm" href="https://maps.apple.com/?daddr=${encodeURIComponent(addr())}" target="_blank" rel="noopener">Apple Maps</a><button class="btn btn--line btn--sm" data-act="copy-addr">${T('Copy address', 'Adresi kopyala')}</button></div>
        <h3>${T('Hours', 'Çalışma saatleri')}</h3>
        <table class="hours"><tbody>${WEEK.map(i => `<tr class="${i === today ? 'is-today' : ''}"><td ${i === today ? `data-today="${T('Today', 'Bugün')}"` : ''}>${dayName(i)}</td><td>${S.hours[i].open ? `${ft(S.hours[i].start)} ${T('to', '-')} ${ft(S.hours[i].end)}` : T('Closed', 'Kapalı')}</td></tr>`).join('')}</tbody></table>
        <ul class="notes"><li><b>${T('Parking', 'Otopark')}</b>${T('Free in our own lot, plus free street parking.', 'Kendi otoparkımızda ve caddede ücretsiz.')}</li><li><b>${T('Accessibility', 'Erişilebilirlik')}</b>${T('Wheelchair-accessible entrance, seating, restroom and parking.', 'Tekerlekli sandalyeye uygun giriş, oturma alanı, tuvalet ve otopark.')}</li><li><b>${T('Payment', 'Ödeme')}</b>${T('Credit and debit cards and mobile payments.', 'Kredi kartı, banka kartı ve mobil ödeme.')}</li></ul>
      </div>
    </div>
  </div></section>

  <section class="sec sec--oat" id="faq"><div class="wrap faq__grid">
    <div><h2 class="h2">${T('Questions', 'Sorular')}</h2><p class="muted" style="font-size:18px">${T('Anything else? Call us at', 'Başka bir sorunuz mu var? Bizi arayın:')} <a href="${tel()}">${esc(S.phone)}</a>.</p></div>
    <div>
      <details class="q"><summary>${T("I'm in pain. What should I do?", 'Ağrım var, ne yapmalıyım?')}</summary><p>${T("Call us during office hours and we'll find the earliest opening.", 'Çalışma saatlerinde bizi arayın, en yakın boş saati bulalım.')} ${ER_NOTE()}</p></details>
      <details class="q"><summary>${T('Are you accepting new patients?', 'Yeni hasta kabul ediyor musunuz?')}</summary><p>${T('Yes. Choose "New patient visit" when you book online, or call us.', 'Evet. Online randevuda "Yeni hasta muayenesi"ni seçin veya bizi arayın.')}</p></details>
      <details class="q"><summary>${T('Do you take dental insurance?', 'Diş sigortası kabul ediyor musunuz?')}</summary><p>${T("We work with dental insurance. Call us with your plan details and we'll tell you what to expect before your visit.", 'Diş sigortalarıyla çalışıyoruz. Poliçe bilgilerinizle bizi arayın, ziyaretten önce ne beklemeniz gerektiğini söyleyelim.')}</p></details>
      <details class="q"><summary>${T('Am I a candidate for a dental implant?', 'İmplant için uygun muyum?')}</summary><p>${T('Most adults with healthy gums and enough jawbone are. An implant consultation is the way to know for sure.', 'Diş etleri sağlıklı ve yeterli çene kemiği olan çoğu yetişkin uygundur. Kesin cevap için implant konsültasyonu gerekir.')} <a href="${svcHref('dental-implants')}">${T('About dental implants', 'Diş implantı hakkında')}</a></p></details>
      <details class="q"><summary>${T('How do I change or cancel?', 'Randevumu nasıl değiştirir veya iptal ederim?')}</summary><p>${T('Use <a href="#/manage">Change a visit</a> with your confirmation code and phone number, or call us. Please give us as much notice as you can.', '<a href="#/manage">Randevum</a> sayfasından onay kodunuz ve telefon numaranızla yapabilir veya bizi arayabilirsiniz. Lütfen mümkün olduğunca erken haber verin.')}</p></details>
    </div>
  </div></section>

  <section class="sec"><div class="wrap"><div class="band">${photo('office', 1600, 700, '')}<h2>${T('Ready when you are.', 'Siz hazır olduğunuzda biz buradayız.')}</h2><div class="band__cta">${bookBtn(T('Book a visit', 'Randevu al'), 'btn--mint')}<a class="btn btn--onink" href="${tel()}">${T('Call', 'Ara')} ${esc(S.phone)}</a></div></div></div></section>
  </main>${footer()}${mbar()}`;
}
function renderService(slug) {
  const s = svcBySlug(slug); if (!s) { location.hash = '#/'; return; }
  const x = sv(s), S = DB.settings, vt = DB.visitTypes.find(v => v.active && v.id === s.vt), sl = vt && S.bookingEnabled ? nextSlots(vt.id, 3) : [], h = S.hours[dow(nowParts().date)];
  document.title = `${x.title} | ${S.shortName}, Arlington Heights`;
  root().innerHTML = `${header()}<main id="main" class="has-mbar">
  <section class="svc-hero"><div class="wrap svc-hero__grid">
    <div><nav class="crumb" aria-label="${T('Breadcrumb', 'Konum')}"><a href="#/">${T('Home', 'Ana sayfa')}</a><span aria-hidden="true">/</span><a href="#/" data-to="care">${T('Care', 'Tedaviler')}</a></nav>
      <h1>${esc(x.title)}</h1><p class="lede">${esc(x.lede)}</p>
      <div class="hero__cta">${bookBtn(x.cta, 'btn--mint', vt ? vt.id : '')}${callBtn()}</div></div>
    <div class="svc-hero__img">${photo(s.img, 1000, 760, '', true)}</div>
  </div></section>
  <section class="sec sec--tight"><div class="wrap svc">
    <div class="svc__main">
      ${s.urgent ? `<div class="alert" role="note"><b>${T('Emergency?', 'Acil durum mu?')}</b> ${ER_NOTE()}</div>` : ''}
      <h2>${T('What it is', 'Nedir?')}</h2><p>${esc(x.what)}</p>
      <h2>${T('When it helps', 'Ne zaman gerekir?')}</h2><ul class="ticks">${x.who.map(w => `<li>${esc(w)}</li>`).join('')}</ul>
      <h2>${T('What happens', 'Süreç nasıl işler?')}</h2><ol class="vsteps">${x.steps.map(([b, t]) => `<li><b>${esc(b)}</b><span>${esc(t)}</span></li>`).join('')}</ol>
      <h2>${T('Costs and insurance', 'Ücret ve sigorta')}</h2><p>${esc(x.cost)}</p>
      <h2>${T('Questions', 'Sorular')}</h2>${x.faq.map(([q, a]) => `<details class="q"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
    </div>
    <aside class="svc__side">
      <div class="sum">
        <h2>${vt ? esc(vtName(vt)) : T('Book a visit', 'Randevu')}</h2>
        ${sl.length ? `<p class="muted" style="font-size:15px;margin-bottom:12px">${T('Next openings', 'En yakın boş saatler')}</p><div class="chips">${sl.map(z => `<a class="chip" href="${bookHref(vt.id, z.d, z.t)}">${dayLabel(z.d)}, ${ft(z.t)}</a>`).join('')}</div>` : ''}
        <div class="sum__btns">${bookBtn(x.cta, 'btn--ink', vt ? vt.id : '')}${callBtn()}</div>
        <p class="sum__note">${h.open ? `${T('Today', 'Bugün')} ${ft(h.start)} ${T('to', '-')} ${ft(h.end)}` : T('Closed today', 'Bugün kapalı')}<br>${esc(addr())}</p>
      </div>
      <nav class="svc__more" aria-label="${T('Other care', 'Diğer tedaviler')}"><b>${T('Other care', 'Diğer tedaviler')}</b>${SERVICES.filter(o => o !== s).map(o => `<a href="${svcHref(o.slug)}">${esc(sv(o).name)}</a>`).join('')}</nav>
    </aside>
  </div></section>
  </main>${footer()}${mbar()}`;
}

/* ============ booking ============ */
let BK = null;
function newBooking(q) {
  const vt = DB.visitTypes.find(v => v.active && v.id === q.v);
  BK = { step: 1, vt: vt ? vt.id : '', urgentOk: false, doctor: 'any', date: q.d || '', time: q.t || '', first: '', last: '', phone: '', email: '', returning: null, sms: false, consent: false, err: '', done: null };
  if (BK.vt) { BK.step = 2; BK.urgentOk = true; if (BK.date && BK.time && slotsFor(BK.date, BK.vt, 'any').some(s => s.time === BK.time)) BK.step = 3; else BK.time = ''; }
}
function renderBook() {
  const S = DB.settings; document.title = `${T('Book a visit', 'Randevu al')} | ${S.shortName}`;
  if (!S.bookingEnabled) { root().innerHTML = `${header(true)}<main class="bk"><div class="wrap"><div class="bk__card" style="max-width:640px"><h1>${T('Online booking is paused', 'Online randevu şu an kapalı')}</h1><p class="sub">${T('Please call us at', 'Lütfen bizi arayın:')} <a href="${tel()}">${esc(S.phone)}</a>.</p></div></div></main>`; return; }
  root().innerHTML = `${header(true)}<main class="bk" id="main"><div class="wrap bk__grid"><div class="bk__card" id="bkmain">${bkMain()}</div><aside class="bk__side"><div class="sum" id="bkside">${bkSide()}</div></aside></div></main>`;
}
function bkSide() {
  const vt = vtById(BK.vt), d = BK.doctor !== 'any' ? docById(BK.doctor) : (DB.doctors.filter(x => x.active).length === 1 ? DB.doctors.find(x => x.active) : null);
  return `<h2>${T('Your visit', 'Randevunuz')}</h2><dl>
    <dt>${T('Visit', 'Ziyaret')}</dt><dd class="${vt ? '' : 'is-empty'}">${vt ? `${esc(vtName(vt))}, ${T('about', 'yaklaşık')} ${vt.duration} ${T('min', 'dk')}` : T('Not chosen yet', 'Henüz seçilmedi')}</dd>
    <dt>${T('When', 'Zaman')}</dt><dd class="${BK.time ? '' : 'is-empty'}">${BK.time ? `${fdLong(BK.date)}, ${ft(BK.time)}` : T('Not chosen yet', 'Henüz seçilmedi')}</dd>
    <dt>${T('With', 'Hekim')}</dt><dd>${d ? esc(`${d.name}${d.title ? ', ' + d.title : ''}`) : T('First available doctor', 'İlk müsait hekim')}</dd>
    <dt>${T('Where', 'Adres')}</dt><dd>${esc(addr())}</dd></dl>
    <p class="sum__note">${T('We only ask for what we need to schedule you. Health questions wait for your visit.', 'Sadece randevu için gereken bilgileri istiyoruz. Sağlık soruları ziyaretinizde konuşulur.')} <a href="#/book" data-act="placeholder">${T('Notice of Privacy Practices', 'Gizlilik bildirimi')}</a></p>`;
}
const bkSteps = () => `<ol class="bk__steps">${[T('Visit type', 'Ziyaret türü'), T('Date and time', 'Tarih ve saat'), T('Your details', 'Bilgileriniz')].map((s, i) => `<li class="${i + 1 < BK.step ? 'is-done' : ''} ${i + 1 === BK.step ? 'is-now' : ''}" ${i + 1 === BK.step ? 'aria-current="step"' : ''}>${s}</li>`).join('')}</ol>`;
function urgentBox() {
  const st = openState();
  return `<div class="urgent" role="region" aria-label="${T('Urgent visit', 'Acil muayene')}">
    <h2>${st.open ? T('We are open now. Calling is fastest.', 'Şu an açığız. En hızlı yol telefon.') : T('We are closed right now.', 'Şu an kapalıyız.')}</h2>
    <p>${st.open ? T('For pain, swelling or a broken tooth, call us and we will look for a time today. You can also book online.', 'Ağrı, şişlik veya kırık dişte bizi arayın, bugün için bir saat bakalım. Online randevu da alabilirsiniz.') : `${esc(stateText(st))}. ${T('Book the earliest urgent time online, or call when we open.', 'En yakın acil saati online alabilir veya açıldığımızda arayabilirsiniz.')}`}</p>
    <div class="row-actions">${st.open ? `${callBtn('btn--ink')}<button class="btn btn--line" data-act="bk-urgent-go">${T('Pick a time online', 'Online saat seç')}</button>` : `<button class="btn btn--ink" data-act="bk-urgent-go">${T('See the earliest times', 'En yakın saatleri gör')}</button>${callBtn()}`}</div>
    <p class="urgent__er">${ER_NOTE()}</p></div>`;
}
function bkMain() {
  if (BK.done) return bkDone();
  const S = DB.settings, n = nowParts();
  if (BK.step === 1) return `${bkSteps()}<h1>${T('What kind of visit?', 'Ne için geliyorsunuz?')}</h1><p class="sub">${T("Pick the closest match. We'll sort out the details in person.", 'Size en yakın olanı seçin. Ayrıntıları muayenede konuşuruz.')}</p>
    <div class="types">${DB.visitTypes.filter(v => v.active).map(v => `<button type="button" class="type ${BK.vt === v.id ? 'is-on' : ''}" data-act="bk-vt" data-v="${v.id}" aria-pressed="${BK.vt === v.id}"><b>${esc(vtName(v))}</b><span>${VT_HINT[v.id] ? T(...VT_HINT[v.id]) : T('Appointment', 'Randevu')}</span><i>${v.duration} ${T('min', 'dk')}</i></button>`).join('')}</div>
    ${BK.vt === 'v_urgent' && !BK.urgentOk ? urgentBox() : ''}`;
  if (BK.step === 2) {
    const span = Math.min(+S.maxDays, 42), days = [];
    for (let i = 0; i <= span; i++) { const d = addDays(n.date, i); days.push({ d, c: slotsFor(d, BK.vt, BK.doctor).length }); }
    if (!BK.date || !days.find(x => x.d === BK.date && x.c)) { const f = days.find(x => x.c); BK.date = f ? f.d : ''; }
    const sl = BK.date ? slotsFor(BK.date, BK.vt, BK.doctor) : [];
    if (BK.time && !sl.some(s => s.time === BK.time)) BK.time = '';
    const docs = DB.doctors.filter(d => d.active);
    return `${bkSteps()}<h1>${T('Pick a time', 'Saat seçin')}</h1><p class="sub">${T('Times are shown in Chicago time.', 'Saatler Chicago saatine göredir.')}</p>
      ${BK.vt === 'v_urgent' ? `<p class="hintbar">${T('In pain right now?', 'Şu an ağrınız mı var?')} <a href="${tel()}">${T('Call', 'Arayın:')} ${esc(S.phone)}</a></p>` : ''}
      ${docs.length > 1 ? `<div class="field"><label for="b-doc">${T('Doctor', 'Hekim')}</label><select id="b-doc" data-bk-select="doctor"><option value="any">${T('First available', 'İlk müsait')}</option>${docs.map(d => `<option value="${d.id}" ${BK.doctor === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>` : ''}
      ${!BK.date ? `<div class="empty">${T('No online openings in the next few weeks. Please call', 'Önümüzdeki haftalarda online boş saat yok. Lütfen arayın:')} <a href="${tel()}">${esc(S.phone)}</a>.</div>` : slotPicker(days, sl, BK.date, BK.time, 'bk')}
      <div class="bk__nav"><button class="btn btn--line" data-act="bk-back">${T('Back', 'Geri')}</button><span class="err" id="bk-err" role="alert">${esc(BK.err)}</span><button class="btn btn--ink" data-act="bk-next">${T('Continue', 'Devam')}</button></div>`;
  }
  const f = (k, l, t = 'text', x = '') => `<div class="field" id="f-${k}"><label for="b-${k}">${l}</label><input id="b-${k}" type="${t}" data-bk="${k}" value="${esc(BK[k])}" ${x}></div>`;
  return `${bkSteps()}<h1>${T('Your details', 'Bilgileriniz')}</h1><p class="sub">${T('So we can confirm your appointment.', 'Randevunuzu onaylayabilmemiz için.')}</p>
    <form data-form="book" novalidate>
      <div class="grid2">${f('first', T('First name', 'Ad'), 'text', 'autocomplete="given-name"')}${f('last', T('Last name', 'Soyad'), 'text', 'autocomplete="family-name"')}</div>
      <div class="grid2">${f('phone', T('Mobile phone', 'Cep telefonu'), 'tel', 'autocomplete="tel" placeholder="(847) 555-0100"')}${f('email', `${T('Email', 'E-posta')} <span class="help">${T('Optional', 'İsteğe bağlı')}</span>`, 'email', 'autocomplete="email"')}</div>
      <div class="field"><span class="lab">${T('Have you been to our office before?', 'Daha önce muayenehanemize geldiniz mi?')}</span><div class="seg2"><button type="button" data-act="bk-ret" data-v="no" class="${BK.returning === false ? 'is-on' : ''}">${T("No, I'm new", 'Hayır, ilk kez')}</button><button type="button" data-act="bk-ret" data-v="yes" class="${BK.returning === true ? 'is-on' : ''}">${T('Yes', 'Evet')}</button></div></div>
      <label class="check"><input type="checkbox" data-bk="sms" ${BK.sms ? 'checked' : ''}> <span>${T('Text me a confirmation and a reminder.', 'Onay ve hatırlatma mesajı gönderin.')} <span class="muted">${T('Optional. Reply STOP any time.', 'İsteğe bağlı. İstediğiniz zaman STOP yazarak durdurabilirsiniz.')}</span></span></label>
      <label class="check"><input type="checkbox" data-bk="consent" ${BK.consent ? 'checked' : ''}> <span>${T(`I understand ${esc(S.shortName)} will use these details only to schedule and contact me about this appointment.`, `${esc(S.shortName)} bu bilgileri sadece randevumu planlamak ve bu randevu hakkında benimle iletişime geçmek için kullanacak.`)}</span></label>
      <div class="bk__nav"><button type="button" class="btn btn--line" data-act="bk-back">${T('Back', 'Geri')}</button><span class="err" id="bk-err" role="alert">${esc(BK.err)}</span><button class="btn btn--ink" type="submit">${T('Request appointment', 'Randevu talebi gönder')}</button></div>
    </form>`;
}
// shared date strip + time slots (booking and the patient's change page)
function slotPicker(days, sl, date, time, p) {
  const am = sl.filter(s => toMin(s.time) < 720), pm = sl.filter(s => toMin(s.time) >= 720);
  const b = l => l.map(s => `<button type="button" class="slot ${time === s.time ? 'is-on' : ''}" data-act="${p}-time" data-v="${s.time}" aria-pressed="${time === s.time}">${ft(s.time)}</button>`).join('');
  return `<div class="dates" aria-label="${T('Date', 'Tarih')}">${days.map(x => `<button type="button" class="date ${date === x.d ? 'is-on' : ''}" data-act="${p}-date" data-v="${x.d}" ${x.c ? '' : 'disabled'} aria-pressed="${date === x.d}"><small>${dayName(dow(x.d), 'short')}</small><b>${+x.d.slice(8)}</b><small>${monShort(x.d)}</small></button>`).join('')}</div>
    ${am.length ? `<p class="slot-group">${T('Morning', 'Öğleden önce')}</p><div class="slots">${b(am)}</div>` : ''}${pm.length ? `<p class="slot-group">${T('Afternoon', 'Öğleden sonra')}</p><div class="slots">${b(pm)}</div>` : ''}`;
}
const TICK = '<div class="done__tick"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#12424F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>';
function bkDone() {
  const a = BK.done;
  return `${TICK}<h1>${a.status === 'confirmed' ? T('You are booked', 'Randevunuz alındı') : T('Request received', 'Talebiniz alındı')}</h1>
    <p class="sub">${a.status === 'confirmed' ? T('Your appointment is confirmed.', 'Randevunuz onaylandı.') : (a.patient.sms ? T("We'll confirm by text shortly.", 'Kısa süre içinde mesajla onaylayacağız.') : T("We'll confirm by phone shortly.", 'Kısa süre içinde telefonla onaylayacağız.'))} ${T('Your confirmation code is', 'Onay kodunuz:')} <span class="ref">${a.ref}</span></p>
    <p class="sub" style="margin-top:-12px">${T('Keep it. You can use it with your phone number to <a href="#/manage">change or cancel</a> online.', 'Bu kodu saklayın. Telefon numaranızla birlikte <a href="#/manage">Randevum</a> sayfasından randevunuzu değiştirebilir veya iptal edebilirsiniz.')}</p>
    <div class="row-actions"><button class="btn btn--line btn--sm" data-act="ics" data-id="${a.id}">${T('Add to calendar', 'Takvime ekle')}</button><a class="btn btn--line btn--sm" href="https://www.google.com/maps/dir/?api=1&destination=${mq()}" target="_blank" rel="noopener">${T('Directions', 'Yol tarifi')}</a><a class="btn btn--ink btn--sm" href="#/">${T('Back to site', 'Siteye dön')}</a></div>`;
}
function refreshBook() { const m = $('#bkmain'); if (m) m.innerHTML = bkMain(); const s = $('#bkside'); if (s) s.innerHTML = bkSide(); }
function bookSubmit() {
  BK.err = ''; $$('.field.has-err').forEach(x => x.classList.remove('has-err'));
  const miss = [], mark = id => { const e = $('#f-' + id); if (e) e.classList.add('has-err'); };
  if (!BK.first.trim()) { miss.push(T('first name', 'adınızı')); mark('first'); }
  if (!BK.last.trim()) { miss.push(T('last name', 'soyadınızı')); mark('last'); }
  if (digits(BK.phone).length < 10) { miss.push(T('a 10-digit mobile number', '10 haneli cep telefonunuzu')); mark('phone'); }
  if (BK.email && !/^\S+@\S+\.\S+$/.test(BK.email)) { miss.push(T('a valid email', 'geçerli bir e-postayı')); mark('email'); }
  if (BK.returning === null) miss.push(T('whether you have visited before', 'daha önce gelip gelmediğinizi'));
  if (miss.length) BK.err = T('Please add ', 'Lütfen ekleyin: ') + miss.join(', ') + '.';
  else if (!BK.consent) BK.err = T('Please tick the last box to continue.', 'Devam etmek için son kutuyu işaretleyin.');
  if (BK.err) { $('#bk-err').textContent = BK.err; return; }
  const vt = vtById(BK.vt), s = slotsFor(BK.date, BK.vt, BK.doctor).find(x => x.time === BK.time);
  if (!s) { BK.time = ''; BK.step = 2; BK.err = T('That time was just taken. Please choose another.', 'Bu saat az önce doldu. Lütfen başka bir saat seçin.'); refreshBook(); return; }
  const status = DB.settings.autoConfirm ? 'confirmed' : 'requested';
  const a = { id: uid('a_'), ref: makeRef(), createdAt: stamp(), source: 'website', status, visitTypeId: vt.id, doctorId: BK.doctor === 'any' ? s.doctorIds[0] : BK.doctor, date: BK.date, time: BK.time, duration: vt.duration,
    patient: { first: BK.first.trim(), last: BK.last.trim(), phone: fmtPhone(BK.phone), email: BK.email.trim(), returning: BK.returning, sms: BK.sms, lang: LANG }, note: '', history: [{ at: stamp(), text: `Requested on the website${LANG === 'tr' ? ' (Turkish)' : ''}` }] };
  DB.appointments.push(a); log('Website', 'Appointment requested', a.ref); notify('request'); save();
  BK.done = a; refreshBook(); window.scrollTo(0, 0);
}
function ics(a) {
  const dt = (d, m) => d.replace(/-/g, '') + 'T' + toHHMM(m).replace(':', '') + '00', s = toMin(a.time);
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//QB Dental//EN', 'BEGIN:VEVENT', `UID:${a.id}@qbdental`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=${TZ}:${dt(a.date, s)}`, `DTEND;TZID=${TZ}:${dt(a.date, s + a.duration)}`, `SUMMARY:${DB.settings.shortName} ${T('appointment', 'randevusu')}`, `LOCATION:${addr().replace(/,/g, '\\,')}`,
    `DESCRIPTION:${T('Code', 'Kod')} ${a.ref}. ${T('Change or cancel on our website or call', 'Değiştirmek veya iptal için web sitemizi kullanın ya da arayın:')} ${DB.settings.phone}.`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

/* ============ patient: change or cancel ============ */
// The patient proves who they are with the confirmation code + the phone number they booked with. Nothing new is collected.
let MG = { step: 'find', ref: '', phone: '', id: null, err: '', date: '', time: '', fails: 0 };
const mgAppt = () => MG.id ? apById(MG.id) : null;
function cutoffPassed(a) { const n = nowParts(), h = +DB.settings.changeCutoffHours || 0, mins = (parseD(a.date) - parseD(n.date)) / 6e4 + toMin(a.time) - n.min; return mins < h * 60; }
function demoPick() { const n = nowParts(); return DB.appointments.filter(a => a.status === 'confirmed' && !a.change && a.date >= addDays(n.date, 2) && a.date <= addDays(n.date, 10)).sort((a, b) => (a.date + a.time) < (b.date + b.time) ? -1 : 1)[0]; }
function renderManage() {
  document.title = `${T('Change a visit', 'Randevum')} | ${DB.settings.shortName}`;
  root().innerHTML = `${header(true)}<main class="bk" id="main"><div class="wrap"><div class="bk__card mg" id="mgmain">${mgMain()}</div></div></main>`;
}
function refreshManage() { const m = $('#mgmain'); if (m) m.innerHTML = mgMain(); }
function mgSummary(a) {
  const vt = vtById(a.visitTypeId), d = docById(a.doctorId);
  return `<dl class="kv kv--site"><dt>${T('Visit', 'Ziyaret')}</dt><dd>${esc(vtName(vt))}</dd><dt>${T('When', 'Zaman')}</dt><dd>${fdLong(a.date)}, ${ft(a.time)}</dd><dt>${T('With', 'Hekim')}</dt><dd>${esc(d ? d.name : '')}</dd><dt>${T('Where', 'Adres')}</dt><dd>${esc(addr())}</dd><dt>${T('Code', 'Kod')}</dt><dd>${a.ref}</dd></dl>`;
}
function mgMain() {
  const S = DB.settings, a = mgAppt();
  if (MG.step === 'find' || !a) {
    const demo = demoPick();
    return `<h1>${T('Change or cancel a visit', 'Randevunuzu değiştirin veya iptal edin')}</h1><p class="sub">${T('Enter the confirmation code from your booking and the phone number you used.', 'Randevu alırken verilen onay kodunu ve kullandığınız telefon numarasını girin.')}</p>
      <form data-form="mg-find" novalidate class="mg__find">
        <div class="field"><label for="mg-ref">${T('Confirmation code', 'Onay kodu')}</label><input id="mg-ref" name="ref" type="text" autocomplete="off" autocapitalize="characters" placeholder="QB-XXXXX" value="${esc(MG.ref)}"></div>
        <div class="field"><label for="mg-phone">${T('Mobile phone', 'Cep telefonu')}</label><input id="mg-phone" name="phone" type="tel" autocomplete="tel" placeholder="(847) 555-0100" value="${esc(MG.phone)}"></div>
        <p class="err" role="alert">${esc(MG.err)}</p>
        <div class="row-actions"><button class="btn btn--ink" type="submit" ${MG.fails >= 5 ? 'disabled' : ''}>${T('Find my visit', 'Randevumu bul')}</button><a class="btn btn--line" href="${tel()}">${T('Call instead', 'Telefonla')}</a></div>
      </form>
      ${demo ? `<div class="demo-hint"><b>${T('For the demo', 'Demo için')}</b> ${T('Try code', 'Şu kodu deneyin:')} <code>${demo.ref}</code> ${T('with phone', 've telefon:')} <code>${esc(demo.patient.phone)}</code> <button class="linkbtn" data-act="mg-demo" data-ref="${demo.ref}" data-phone="${esc(demo.patient.phone)}">${T('Fill in', 'Doldur')}</button></div>` : ''}`;
  }
  const back = `<button class="linkbtn mg__back" data-act="mg-step" data-v="view">${T('Back', 'Geri')}</button>`;
  if (MG.step === 'move') {
    const n = nowParts(), span = Math.min(+S.maxDays, 42), days = [];
    for (let i = 0; i <= span; i++) { const d = addDays(n.date, i); days.push({ d, c: slotsFor(d, a.visitTypeId, a.doctorId, { excludeId: a.id }).filter(s => !(d === a.date && s.time === a.time)).length }); }
    if (!MG.date || !days.find(x => x.d === MG.date && x.c)) { const f = days.find(x => x.c); MG.date = f ? f.d : ''; }
    const sl = MG.date ? slotsFor(MG.date, a.visitTypeId, a.doctorId, { excludeId: a.id }).filter(s => !(MG.date === a.date && s.time === a.time)) : [];
    if (MG.time && !sl.some(s => s.time === MG.time)) MG.time = '';
    return `${back}<h1>${T('Pick a new time', 'Yeni bir saat seçin')}</h1><p class="sub">${T('Now booked:', 'Şu anki randevunuz:')} <b>${fdLong(a.date)}, ${ft(a.time)}</b>. ${T('It stays booked until the office confirms the new time.', 'Muayenehane yeni saati onaylayana kadar bu randevunuz geçerli kalır.')}</p>
      ${MG.date ? slotPicker(days, sl, MG.date, MG.time, 'mg') : `<div class="empty">${T('No other online openings soon. Please call', 'Yakında başka online boş saat yok. Lütfen arayın:')} <a href="${tel()}">${esc(S.phone)}</a>.</div>`}
      <div class="bk__nav"><span class="err" id="mg-err" role="alert">${esc(MG.err)}</span><button class="btn btn--ink" data-act="mg-send" style="margin-left:auto">${T('Send change request', 'Değişiklik talebi gönder')}</button></div>`;
  }
  if (MG.step === 'cancel') return `${back}<h1>${T('Cancel this visit?', 'Bu randevu iptal edilsin mi?')}</h1>${mgSummary(a)}<p class="sub">${T('The time will be offered to other patients.', 'Bu saat diğer hastalara açılacak.')}</p>
      <div class="row-actions"><button class="btn btn--danger" data-act="mg-cancel">${T('Yes, cancel it', 'Evet, iptal et')}</button><button class="btn btn--line" data-act="mg-step" data-v="view">${T('Keep my visit', 'Randevum kalsın')}</button></div>`;
  if (MG.step === 'sent') return `${TICK}<h1>${T('Change request sent', 'Değişiklik talebiniz gönderildi')}</h1><p class="sub">${T(`You asked for <b>${fdLong(a.change.date)}, ${ft(a.change.time)}</b>. We will confirm ${a.patient.sms ? 'by text' : 'by phone'}. Until then your current time stays booked.`, `<b>${fdLong(a.change.date)}, ${ft(a.change.time)}</b> için talepte bulundunuz. ${a.patient.sms ? 'Mesajla' : 'Telefonla'} onaylayacağız. O zamana kadar mevcut randevunuz geçerli.`)}</p><div class="row-actions"><button class="btn btn--line btn--sm" data-act="mg-step" data-v="view">${T('See my visit', 'Randevumu gör')}</button><a class="btn btn--ink btn--sm" href="#/">${T('Back to site', 'Siteye dön')}</a></div>`;
  if (MG.step === 'cancelled') return `${TICK}<h1>${T('Your visit is cancelled', 'Randevunuz iptal edildi')}</h1><p class="sub">${T('Thank you for letting us know.', 'Haber verdiğiniz için teşekkürler.')}</p><div class="row-actions">${bookBtn(T('Book a new visit', 'Yeni randevu al'), 'btn--ink btn--sm')}<a class="btn btn--line btn--sm" href="#/">${T('Back to site', 'Siteye dön')}</a></div>`;
  // view
  const n = nowParts(), past = a.date < n.date || ['completed', 'checked_in', 'no_show'].includes(a.status), late = cutoffPassed(a), ch = a.change;
  let body = '';
  if (a.status === 'cancelled') body = `<div class="notice">${T('This visit is cancelled.', 'Bu randevu iptal edildi.')}</div><div class="row-actions">${bookBtn(T('Book a new visit', 'Yeni randevu al'), 'btn--ink')}</div>`;
  else if (past) body = `<div class="notice">${T('This visit has already taken place.', 'Bu randevu gerçekleşti.')}</div><div class="row-actions">${bookBtn(T('Book a new visit', 'Yeni randevu al'), 'btn--ink')}</div>`;
  else {
    if (ch && ch.type === 'reschedule' && ch.status === 'pending') body += `<div class="notice notice--wait"><b>${T('Change request waiting', 'Değişiklik talebi bekliyor')}</b>${T(`You asked to move to ${fdLong(ch.date)}, ${ft(ch.time)}. The office will confirm soon.`, `${fdLong(ch.date)}, ${ft(ch.time)} saatine almak istediniz. Muayenehane kısa süre içinde onaylayacak.`)} <button class="linkbtn" data-act="mg-withdraw">${T('Withdraw request', 'Talebi geri çek')}</button></div>`;
    else if (ch && ch.type === 'reschedule' && ch.status === 'declined') body += `<div class="notice">${T("We couldn't move your visit to the time you asked for. Your original time is still booked, and we will call you to find another.", 'Randevunuzu istediğiniz saate alamadık. Mevcut randevunuz geçerli; başka bir saat bulmak için sizi arayacağız.')}</div>`;
    else if (ch && ch.type === 'reschedule' && ch.status === 'approved') body += `<div class="notice notice--ok">${T('Your new time is confirmed.', 'Yeni saatiniz onaylandı.')}</div>`;
    body += late ? `<div class="notice">${T(`Changes less than ${S.changeCutoffHours} hours before the visit need a phone call.`, `Randevuya ${S.changeCutoffHours} saatten az kaldıysa değişiklik için lütfen arayın.`)} <a href="${tel()}">${esc(S.phone)}</a></div><div class="row-actions">${callBtn('btn--ink')}</div>`
      : `<div class="row-actions">${ch && ch.status === 'pending' ? '' : `<button class="btn btn--ink" data-act="mg-step" data-v="move">${T('Change time', 'Saati değiştir')}</button>`}<button class="btn btn--line" data-act="mg-step" data-v="cancel">${T('Cancel visit', 'Randevuyu iptal et')}</button><button class="btn btn--line" data-act="ics" data-id="${a.id}">${T('Add to calendar', 'Takvime ekle')}</button></div>`;
  }
  return `<button class="linkbtn mg__back" data-act="mg-out">${T('Look up another visit', 'Başka randevu ara')}</button><h1>${T(`Hello, ${esc(a.patient.first)}`, `Merhaba ${esc(a.patient.first)}`)}</h1>${mgSummary(a)}${body}`;
}
function mgFind(f) {
  MG.ref = f.ref.value.trim().toUpperCase(); MG.phone = f.phone.value.trim(); MG.err = '';
  if (MG.fails >= 5) { MG.err = T('Too many tries. Please call us.', 'Çok fazla deneme yapıldı. Lütfen bizi arayın.'); return refreshManage(); }
  const ref = MG.ref.startsWith('QB-') ? MG.ref : 'QB-' + MG.ref, ph = digits(MG.phone).slice(-10);
  const a = ph.length === 10 ? DB.appointments.find(x => x.ref === ref && digits(x.patient.phone).slice(-10) === ph) : null;
  if (!a) { MG.fails++; MG.err = MG.fails >= 5 ? T('Too many tries. Please call us.', 'Çok fazla deneme yapıldı. Lütfen bizi arayın.') : T("We couldn't find a visit with that code and phone number. Check both and try again.", 'Bu kod ve telefonla bir randevu bulamadık. İkisini de kontrol edip tekrar deneyin.'); return refreshManage(); }
  MG.fails = 0; MG.id = a.id; MG.step = 'view'; MG.date = ''; MG.time = '';
  log('Patient (online)', 'Opened own appointment', a.ref); save(); refreshManage();
}
function mgSend() {
  const a = mgAppt(); if (!MG.time) { MG.err = T('Choose a time first.', 'Önce bir saat seçin.'); $('#mg-err').textContent = MG.err; return; }
  if (!slotsFor(MG.date, a.visitTypeId, a.doctorId, { excludeId: a.id }).some(s => s.time === MG.time)) { MG.err = T('That time was just taken. Please choose another.', 'Bu saat az önce doldu. Lütfen başka bir saat seçin.'); MG.time = ''; return refreshManage(); }
  a.change = { type: 'reschedule', status: 'pending', date: MG.date, time: MG.time, doctorId: a.doctorId, fromDate: a.date, fromTime: a.time, at: stamp() };
  a.history.push({ at: stamp(), text: `Patient asked online to move to ${fmtDate(MG.date)} ${fmtTime(MG.time)}` });
  log('Patient (online)', 'Asked to change appointment', a.ref); notify('change'); save(); MG.step = 'sent'; MG.err = ''; refreshManage(); window.scrollTo(0, 0);
}
function mgCancel() {
  const a = mgAppt(); a.status = 'cancelled'; a.change = { type: 'cancel', status: 'done', at: stamp() };
  a.history.push({ at: stamp(), text: 'Cancelled by the patient online' }); log('Patient (online)', 'Cancelled appointment', a.ref); notify('cancel'); save();
  MG.step = 'cancelled'; refreshManage(); window.scrollTo(0, 0);
}
