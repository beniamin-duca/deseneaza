# Povesti din Biblie — Public Surface (Plan 1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the public bible-stories experience — landing timeline, story detail page with side-by-side text and drawing canvas, IndexedDB-backed progress + canvas auto-save, all 50 Romanian retellings, integrated into the home page.

**Architecture:** New route tree at `/povesti` and `/povesti/[storyId]`, with `lib/stories.ts` as the static seed and `lib/progress.ts` wrapping IndexedDB (via the `idb` package) for per-device progress and per-story canvas blobs. Reuses existing `KidCanvas`, `FloatingToolbar`, `FloatingTopBar`. Strict linear unlock.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4, `idb` (1 KB IndexedDB wrapper), existing `vaul` Drawer, existing Radix primitives.

**Spec:** `docs/superpowers/specs/2026-05-09-bible-stories-design.md`

**Out of scope (Plan 2):** the `/admin/povesti` editing surface, Vercel KV, the seed-plus-overrides merge.

**Testing note:** This codebase has no automated test runner. Each task verifies via `pnpm exec tsc --noEmit` plus a smoke check in `pnpm dev`. The final task runs `pnpm build` and the DevTools breakpoint walkthrough.

---

## File map

**New files:**
- `lib/stories.ts` — 50 stories with full Romanian text, types, and helpers
- `lib/progress.ts` — IndexedDB wrapper (status + canvas blobs)
- `components/story-checkpoint.tsx` — single checkpoint visual on the timeline
- `components/story-panel.tsx` — story-text panel used in detail page (and inside the mobile bottom sheet)
- `app/povesti/page.tsx` — landing with the magic timeline
- `app/povesti/[storyId]/page.tsx` — story detail page

**Modified files:**
- `components/kid-canvas.tsx` — add `initialImageBlob` and `onCanvasIdle` props
- `app/page.tsx` — add a third "Povesti din Biblie" card

---

## Task 1: lib/stories.ts skeleton + types + 3 sample stories

**Files:**
- Create: `lib/stories.ts`

- [ ] **Step 1: Create the file with types, helpers, and the first 3 stories**

```ts
export type Testament = 'vechi' | 'nou'

export interface Story {
  id: string
  order: number
  testament: Testament
  titleRo: string
  scriptureRef: string
  summary: string
  paragraphs: string[]
  templateSrc: string | null
  accentColor: string
}

export const STORIES: Story[] = [
  {
    id: 'creatie',
    order: 1,
    testament: 'vechi',
    titleRo: 'Creatia lumii',
    scriptureRef: 'Geneza 1',
    summary: 'In sase zile, Dumnezeu a facut cerul, pamantul si toate cele.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'La inceput, totul era intuneric si gol. Atunci Dumnezeu a vorbit, si lumina s-a aratat. "Sa fie lumina!" a spus El, si dintr-o data totul a stralucit.',
      'In sase zile, Dumnezeu a facut cerul si pamantul. A facut soarele, luna si stelele care clipesc noaptea. A umplut marile cu pesti si cerul cu pasari care zboara.',
      'A facut munti si flori, copaci grei de fructe si animale de toate felurile — leul, iepurasul, fluturele, elefantul. La urma, a facut omul, dupa chipul Sau.',
      'Si Dumnezeu a privit tot ce a facut si a vazut ca era foarte bun. In ziua a saptea, S-a odihnit.',
    ],
  },
  {
    id: 'adam-si-eva',
    order: 2,
    testament: 'vechi',
    titleRo: 'Adam si Eva',
    scriptureRef: 'Geneza 2-3',
    summary: 'Primii oameni in gradina Edenului si neascultarea lor.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'Dumnezeu a pus pe Adam si Eva intr-o gradina frumoasa, gradina Edenului. Acolo cresteau cei mai dulci pomi si curgeau parauri limpezi.',
      '"Puteti manca din toti pomii", le-a spus Dumnezeu, "dar nu si din pomul cunoasterii binelui si raului. Daca mancati de acolo, veti muri."',
      'Dar sarpele cel viclean a venit la Eva. "Mancati! Veti fi ca Dumnezeu!" i-a soptit. Eva a luat un fruct si a mancat. I-a dat si lui Adam.',
      'Atunci, pentru prima data, le-a fost rusine. Dumnezeu i-a chemat: "Unde sunteti?" Adam a raspuns: "Ne-am ascuns." Pentru ca au neascultat, Dumnezeu i-a scos din gradina. Dar nu i-a uitat — le-a fagaduit ca intr-o zi va trimite un Mantuitor.',
    ],
  },
  {
    id: 'cain-si-abel',
    order: 3,
    testament: 'vechi',
    titleRo: 'Cain si Abel',
    scriptureRef: 'Geneza 4',
    summary: 'Doi frati, doua daruri, o gelozie care a schimbat lumea.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'Adam si Eva au avut doi baieti: Cain si Abel. Cain era plugar, iar Abel pastor de oi.',
      'Intr-o zi, fiecare a adus dar lui Dumnezeu. Abel a adus mielul cel mai bun. Cain a adus din roadele campului, dar fara inima. Dumnezeu a primit darul lui Abel cu placere, dar nu si pe al lui Cain.',
      'Cain s-a maniat. In loc sa indrepte ce era gresit, l-a dus pe fratele sau in camp si l-a omorat.',
      '"Unde este fratele tau?" l-a intrebat Dumnezeu. Cain a mintit. Atunci Dumnezeu i-a spus: "Glasul sangelui sau striga catre Mine." Pacatul intra in lume incet, incet — si numai Dumnezeu ne poate scapa de el.',
    ],
  },
]

export function getStoryById(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id)
}

export function getStoryByOrder(order: number): Story | undefined {
  return STORIES.find((s) => s.order === order)
}

export function getNextStory(id: string): Story | undefined {
  const current = getStoryById(id)
  if (!current) return undefined
  return getStoryByOrder(current.order + 1)
}

export function getAllStories(): Story[] {
  return [...STORIES].sort((a, b) => a.order - b.order)
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/stories.ts
git commit -m "Stories data layer + first 3 stories"
```

---

## Task 2: Add Old Testament stories 4–30

**Files:**
- Modify: `lib/stories.ts` — append entries 4 through 30 inside the `STORIES` array.

- [ ] **Step 1: Append OT stories 4–30**

Insert these entries inside the `STORIES` array, after the `cain-si-abel` entry, before the closing `]`. Each entry follows the same shape as Task 1's entries.

```ts
  {
    id: 'arca-noe',
    order: 4,
    testament: 'vechi',
    titleRo: 'Arca lui Noe',
    scriptureRef: 'Geneza 6-9',
    summary: 'Noe, animalele si potopul cel mare.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'Demult, oamenii uitasera de Dumnezeu si faceau numai rele. Doar Noe il iubea pe Dumnezeu. Asa ca Dumnezeu i-a spus: "Construieste o corabie mare, o arca, ca sa scapi de potop."',
      'Noe a muncit ani de zile. Cand arca a fost gata, a urcat in ea cu familia lui si cu cate doua animale din fiecare fel — leul si leoaica, elefantul si elefantica, soricelul si soricica.',
      'Apoi a inceput sa ploua. A plouat patruzeci de zile si patruzeci de nopti. Apa a acoperit tot pamantul, dar arca lui Noe plutea linistita.',
      'Cand ploaia s-a oprit, Noe a trimis un porumbel. Porumbelul s-a intors cu o frunza de maslin in cioc — semn ca pamantul se uscase. Atunci au coborat toti din arca, iar Dumnezeu a pus pe cer un curcubeu, ca o promisiune ca nu va mai trimite niciodata un asemenea potop.',
    ],
  },
  {
    id: 'turnul-babel',
    order: 5,
    testament: 'vechi',
    titleRo: 'Turnul Babel',
    scriptureRef: 'Geneza 11',
    summary: 'Oamenii au vrut sa ajunga la cer prin propria putere.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'Dupa potop, oamenii s-au inmultit pe pamant. Toti vorbeau aceeasi limba. Au zis: "Hai sa zidim un turn pana la cer! Sa fim slaviti."',
      'Au facut caramizi si au inceput sa zideasca. Turnul crestea tot mai sus. Dar nu il faceau pentru Dumnezeu, ci pentru ei.',
      'Dumnezeu a venit sa vada turnul. A spus: "Sa le incurcam limba, ca sa nu se mai inteleaga unii pe altii."',
      'Oamenii au inceput sa vorbeasca limbi diferite. Nu mai puteau lucra impreuna. Au lasat turnul si s-au imprastiat in toata lumea. Asa s-au nascut popoarele.',
    ],
  },
  {
    id: 'avraam-chemat',
    order: 6,
    testament: 'vechi',
    titleRo: 'Avraam, prietenul lui Dumnezeu',
    scriptureRef: 'Geneza 12',
    summary: 'Un om a plecat la drum pe baza unei singure fagaduinte.',
    accentColor: '#FFB347',
    templateSrc: null,
    paragraphs: [
      'In tara Ur traia un om cu numele Avraam. Intr-o zi, Dumnezeu i-a vorbit: "Iesi din tara ta, din casa tatalui tau, si du-te in tara pe care ti-o voi arata."',
      'Avraam avea 75 de ani. Dar a crezut. Si-a luat sotia, pe Sara, si toate ale lui, si a plecat.',
      'A mers prin pustii si peste rauri, fara sa stie pe unde merge. Dumnezeu il calauzea.',
      'Dumnezeu i-a fagaduit: "Te voi face un popor mare. Toate neamurile pamantului vor fi binecuvantate prin tine." Avraam a crezut, si Dumnezeu i-a numit "prietenul Meu".',
    ],
  },
  {
    id: 'isaac-promis',
    order: 7,
    testament: 'vechi',
    titleRo: 'Isaac, copilul promis',
    scriptureRef: 'Geneza 21',
    summary: 'Sara a ras, dar Dumnezeu a ras la urma.',
    accentColor: '#FFB347',
    templateSrc: null,
    paragraphs: [
      'Avraam si Sara au imbatranit, dar nu aveau copii. Sara avea 90 de ani. "Vom mai avea vreodata un copil?" se intrebau.',
      'Intr-o zi, trei oaspeti au sosit la cortul lor. Avraam i-a primit cu bucurie. Sara a copt paine, Avraam a taiat un vitel gras.',
      'Unul dintre ei a spus: "La anul, pe vremea aceasta, Sara va avea un fiu." Sara, ascultand din cort, a ras: "Eu, batrana, sa am copil?"',
      'Dar Dumnezeu a fost credincios. Anul urmator s-a nascut Isaac. Numele lui inseamna "ras" — pentru ca Dumnezeu a adus zambete acolo unde parea imposibil.',
    ],
  },
  {
    id: 'iacov-si-esau',
    order: 8,
    testament: 'vechi',
    titleRo: 'Iacov si Esau',
    scriptureRef: 'Geneza 25-27',
    summary: 'Doi frati gemeni, o farfurie de ciorba si o iertare la sfarsit.',
    accentColor: '#FFB347',
    templateSrc: null,
    paragraphs: [
      'Isaac a avut doi fii gemeni: Esau, primul nascut, paros si vanator, si Iacov, mai linistit, care statea acasa.',
      'Intr-o zi, Esau a venit obosit din vanatoare. Iacov fierbea o ciorba rosie. "Da-mi ciorba!" a strigat Esau. Iacov a zis: "Iti dau, dar imi dai mie dreptul de prim-nascut." Esau, prea infometat sa se gandeasca, a primit. Si-a vandut dreptul pentru o farfurie de ciorba.',
      'Mai tarziu, Iacov a luat si binecuvantarea cuvenita lui Esau, prefacandu-se ca este fratele lui in fata tatalui lor batran si orb. Esau s-a maniat foarte tare. Iacov a fugit departe.',
      'A fost o iertare la sfarsit. Dupa multi ani, fratii s-au reintalnit. Iacov s-a inchinat pana la pamant, iar Esau l-a imbratisat. Lacrimile au curs din ochii amandurora. Dumnezeu vindeca chiar si certurile cele mai vechi.',
    ],
  },
  {
    id: 'iosif-haina',
    order: 9,
    testament: 'vechi',
    titleRo: 'Iosif si haina colorata',
    scriptureRef: 'Geneza 37',
    summary: 'Un dar al tatalui, gelozia fratilor si un drum spre Egipt.',
    accentColor: '#FFB347',
    templateSrc: null,
    paragraphs: [
      'Iacov a avut doisprezece fii, dar pe Iosif il iubea cel mai mult. I-a facut o haina lunga, in toate culorile curcubeului.',
      'Fratii lui Iosif s-au invidiat. Cand Iosif a povestit visele lui — ca toti il vor saluta intr-o zi — au fiert de mania.',
      'Intr-o zi, Iosif a fost trimis sa-si caute fratii pe camp. Cand l-au vazut venind, au zis: "Iata visatorul!" L-au prins, i-au luat haina si l-au vandut unor negustori care mergeau in Egipt.',
      'Au luat haina, au inmuiat-o in sange de capra si i-au dus-o tatalui lor: "Iosif a fost mancat de o fiara." Iacov a plans amar. Dar Dumnezeu nu il uitase pe Iosif.',
    ],
  },
  {
    id: 'iosif-egipt',
    order: 10,
    testament: 'vechi',
    titleRo: 'Iosif in Egipt',
    scriptureRef: 'Geneza 41-45',
    summary: 'Din rob in palat, si o iertare care a salvat o familie.',
    accentColor: '#FFB347',
    templateSrc: null,
    paragraphs: [
      'In Egipt, Iosif a fost vandut ca rob. A muncit cu credinta si a ajuns in slujba lui Faraon. Dar a fost si in inchisoare pe nedrept. Mereu Dumnezeu era cu el.',
      'Intr-o noapte, Faraon a avut un vis ciudat: sapte vaci grase si sapte vaci slabe care le mancau. Nimeni nu putea talmaci. Iosif a fost chemat. "Vor veni sapte ani de belsug si apoi sapte ani de foamete", a spus.',
      'Faraon l-a numit pe Iosif mai mare peste tot Egiptul. In anii buni a strans grau in hambare. In anii saraci, a hranit toata lumea.',
      'Atunci au venit din Canaan si fratii lui, sa cumpere paine. Nu l-au cunoscut. Iosif s-a aratat lor: "Eu sunt Iosif, fratele vostru!" Si i-a iertat. "Voi ati gandit rau", le-a spus, "dar Dumnezeu a intors totul in bine."',
    ],
  },
  {
    id: 'moise-cosulet',
    order: 11,
    testament: 'vechi',
    titleRo: 'Moise in cosulet',
    scriptureRef: 'Exod 2',
    summary: 'O mama curajoasa, un cosulet pe Nil si o printesa cu inima buna.',
    accentColor: '#FF6B6B',
    templateSrc: null,
    paragraphs: [
      'Anii au trecut. Evreii s-au inmultit in Egipt si au ajuns robi. Faraon cel rau a poruncit ca toti baietii nou-nascuti sa fie aruncati in apa.',
      'O mama l-a ascuns pe pruncul ei trei luni. Cand nu l-a mai putut tine ascuns, a impletit un cosulet de papura, l-a uns cu smoala si a pus copilul inauntru. A pus cosul pe Nil, langa mal.',
      'Sora copilului, Mariam, statea de departe sa vada ce se intampla. Atunci a venit fata lui Faraon sa se scalde. A vazut cosuletul. "Auzi, plange!" a spus. "Trebuie sa fie un copil de evreu."',
      'Mariam a iesit: "Sa caut o doica?" Si i-a adus chiar pe mama copilului. Asa Moise a fost crescut in palatul lui Faraon, dar laptele si cantecele de leagan erau de la mama lui.',
    ],
  },
  {
    id: 'rugul-aprins',
    order: 12,
    testament: 'vechi',
    titleRo: 'Rugul aprins',
    scriptureRef: 'Exod 3',
    summary: 'Un foc care nu mistuia si o chemare care i-a schimbat viata.',
    accentColor: '#FF6B6B',
    templateSrc: null,
    paragraphs: [
      'Moise a crescut, dar a trebuit sa fuga in pustie. A devenit pastor.',
      'Intr-o zi, pe muntele Horeb, a vazut un rug care ardea — dar nu se mistuia. Frunzele faceau flacari, dar nu cadeau.',
      'Moise s-a apropiat sa vada. Atunci a auzit un glas: "Moise, Moise! Scoate-ti incaltamintea, caci locul pe care stai este sfant. Eu sunt Dumnezeul lui Avraam, Isaac si Iacov."',
      'Moise si-a acoperit fata. Dumnezeu a spus: "Am vazut suferinta poporului Meu in Egipt. Te trimit pe tine sa-i scoti afara." Moise s-a temut: "Cine sunt eu?" Dar Dumnezeu i-a fagaduit: "Eu voi fi cu tine."',
    ],
  },
  {
    id: 'zece-plagi',
    order: 13,
    testament: 'vechi',
    titleRo: 'Cele zece plagi',
    scriptureRef: 'Exod 7-12',
    summary: 'Zece minuni cumplite ca sa-l convinga pe Faraon.',
    accentColor: '#FF6B6B',
    templateSrc: null,
    paragraphs: [
      'Moise s-a intors in Egipt si a stat in fata lui Faraon. "Asa zice Dumnezeu: Lasa pe poporul Meu sa plece!"',
      'Faraon a ras: "Cine este Domnul ca sa-L ascult?" Si a refuzat. Atunci Dumnezeu a trimis zece plagi peste Egipt.',
      'Apa Nilului s-a facut sange. Au venit broaste, paduchi, muste. Vitele au murit, pe oameni i-au lovit bube. A venit grindina ca focul, lacuste care au mancat tot, intuneric care s-a putut pipai.',
      'A zecea plaga a fost cea mai grea: in fiecare casa egipteana, intaiul nascut a murit. Numai casele evreilor — care unsesera usile cu sange de miel — au fost crutate. Atunci Faraon a strigat: "Plecati! Plecati cat mai repede!"',
    ],
  },
  {
    id: 'marea-rosie',
    order: 14,
    testament: 'vechi',
    titleRo: 'Trecerea Marii Rosii',
    scriptureRef: 'Exod 14',
    summary: 'Marea s-a despicat si poporul a trecut pe uscat.',
    accentColor: '#FF6B6B',
    templateSrc: null,
    paragraphs: [
      'Evreii au plecat in graba din Egipt, sase sute de mii de oameni, cu copiii si turmele. Mergeau bucurosi. Dar Faraon s-a razgandit: "I-am lasat sa plece! Sa-i prind inapoi!" A trimis carele lui dupa ei.',
      'Cand evreii au ajuns la Marea Rosie, marea era in fata, carele veneau din spate. Erau in capcana. Au inceput sa planga. Moise le-a spus: "Nu va temeti! Domnul se va lupta pentru voi."',
      'Atunci Moise a intins toiagul peste mare. Dumnezeu a trimis un vant puternic. Apele s-au desfacut in doua. Pe fundul marii a aparut un drum uscat.',
      'Evreii au trecut. Cand au pasit pe celalalt mal, carele lui Faraon erau in mijlocul marii. Apa s-a inchis peste ele. Poporul a cantat de bucurie: "Domnul este puterea mea si cantarea mea!"',
    ],
  },
  {
    id: 'mana-din-cer',
    order: 15,
    testament: 'vechi',
    titleRo: 'Mana din cer',
    scriptureRef: 'Exod 16',
    summary: 'Paine cazuta din cer in fiecare dimineata, patruzeci de ani.',
    accentColor: '#FF6B6B',
    templateSrc: null,
    paragraphs: [
      'Drumul prin pustie era lung. Hrana s-a sfarsit. Poporul a inceput sa cartesca: "Mai bine eram in Egipt, unde aveam paine!"',
      'Dumnezeu a auzit. I-a spus lui Moise: "Le voi da paine din cer."',
      'Dimineata, cand s-au trezit, pamantul era acoperit cu un strat alb si dulce, ca rouaua. "Ce este aceasta?" se intrebau. "Mana", au spus — adica "ce este?"',
      'Au strans cat le trebuia pentru ziua aceea. In fiecare zi, mana cadea din nou. Dumnezeu i-a hranit asa patruzeci de ani — pana au ajuns in tara fagaduita.',
    ],
  },
  {
    id: 'zece-porunci',
    order: 16,
    testament: 'vechi',
    titleRo: 'Cele zece porunci',
    scriptureRef: 'Exod 20',
    summary: 'Zece reguli scrise cu degetul lui Dumnezeu pe muntele Sinai.',
    accentColor: '#FF6B6B',
    templateSrc: null,
    paragraphs: [
      'Dupa trei luni in pustie, evreii au ajuns la muntele Sinai. Moise s-a urcat sus, in nori si fulgere. Acolo Dumnezeu i-a dat doua table de piatra cu Cele Zece Porunci scrise.',
      '"Sa nu ai alti dumnezei afara de Mine. Sa nu-ti faci chip cioplit. Sa nu iei numele Domnului in desert. Cinsteste ziua de odihna. Cinsteste pe tatal tau si pe mama ta."',
      '"Sa nu ucizi. Sa nu fii desfranat. Sa nu furi. Sa nu marturisesti minciuna. Sa nu poftesti ce este al altuia."',
      'Aceste zece reguli au fost daruite poporului ca sa traiasca in pace cu Dumnezeu si unul cu altul. Ele sunt scrise si in inima oricui Il iubeste pe Domnul.',
    ],
  },
  {
    id: 'ierihon',
    order: 17,
    testament: 'vechi',
    titleRo: 'Iosua la Ierihon',
    scriptureRef: 'Iosua 6',
    summary: 'Sapte ocoluri, sapte trambite si zidurile s-au prabusit.',
    accentColor: '#A1887F',
    templateSrc: null,
    paragraphs: [
      'Dupa moartea lui Moise, Iosua a dus poporul in tara fagaduita. Dar in fata lor era Ierihonul — o cetate cu ziduri groase, ferecata.',
      'Dumnezeu i-a spus lui Iosua un plan ciudat: "Inconjurati cetatea o data pe zi, sase zile la rand. In ziua a saptea, inconjurati de sapte ori. Apoi sunati din trambite si strigati."',
      'Soldatii au facut intocmai. Sase zile, in tacere, au mers in jurul Ierihonului. Locuitorii rideau de sus.',
      'In ziua a saptea, dupa al saptelea ocol, preotii au sunat din trambite. Tot poporul a strigat. Si zidurile, dintr-o data, s-au prabusit. Ierihonul a fost luat — nu prin sabie, ci prin credinta.',
    ],
  },
  {
    id: 'ghedeon',
    order: 18,
    testament: 'vechi',
    titleRo: 'Ghedeon si trambitele',
    scriptureRef: 'Judecatori 7',
    summary: 'Trei sute de oameni si Dumnezeu au pus pe fuga o oaste.',
    accentColor: '#A1887F',
    templateSrc: null,
    paragraphs: [
      'Madianitii navaleau peste Israel ca lacustele. Ghedeon, un om timid, a fost ales sa salveze poporul.',
      'A strans 32.000 de soldati. Dar Dumnezeu i-a spus: "Sunt prea multi. Cei fricosi sa plece." 22.000 au plecat. "Sunt inca prea multi", a zis Dumnezeu. A coborat cu ei la rau, si numai cei care au baut din mana au ramas — 300 de oameni.',
      'Cu 300, Ghedeon a infruntat o oaste de mii. Dumnezeu i-a dat un plan: fiecare soldat a luat o trambita si o oala cu o faclie inauntru. Au inconjurat tabara dusmana noaptea.',
      'Dintr-o data, au sunat din trambite, au sparte oalele si au strigat: "Sabia Domnului si a lui Ghedeon!" Madianitii s-au speriat asa de tare incat au luat-o la fuga, lovindu-se intre ei. Cu putin si cu Dumnezeu, ai destul.',
    ],
  },
  {
    id: 'samson',
    order: 19,
    testament: 'vechi',
    titleRo: 'Samson cel puternic',
    scriptureRef: 'Judecatori 16',
    summary: 'Cea mai mare putere si cea mai mare slabiciune.',
    accentColor: '#A1887F',
    templateSrc: null,
    paragraphs: [
      'Samson era cel mai puternic om din lume. Putea rupe leii cu mainile goale si dobori porti de cetate. Puterea lui era de la Dumnezeu si statea in parul lui niciodata taiat.',
      'Dar Samson a iubit-o pe Dalila, o femeie filisteana. Dusmanii i-au platit-o sa afle secretul puterii lui. Trei nopti la rand, Dalila l-a intrebat. Trei nopti, Samson a glumit cu ea.',
      'Pana cand, intr-o zi, obosit de cicaleli, i-a spus adevarul: "Daca mi se va rade parul, voi pierde puterea." In timp ce dormea, Dalila i-a chemat pe filisteni. I-au taiat parul si i-au scos ochii.',
      'L-au dus orb in templul lor sa rada de el. Samson a strigat: "Doamne, da-mi puterea inca o data!" A pus mainile pe stalpii templului si a impins. Templul s-a prabusit. Cu rugaciune si pocainta, chiar si o viata cazuta poate sluji lui Dumnezeu.',
    ],
  },
  {
    id: 'rut-si-boaz',
    order: 20,
    testament: 'vechi',
    titleRo: 'Rut si Boaz',
    scriptureRef: 'Rut 1-4',
    summary: 'O straina credincioasa si un strabunic al lui Iisus.',
    accentColor: '#A1887F',
    templateSrc: null,
    paragraphs: [
      'Rut era o femeie tanara din Moab. Sotul ei a murit. Soacra ei, Naomi, a vrut sa se intoarca in Israel. Rut a urmat-o: "Unde mergi tu, voi merge si eu. Poporul tau va fi poporul meu si Dumnezeul tau, Dumnezeul meu."',
      'In Israel erau saraci. Rut a iesit pe ogor sa stranga spice ramase dupa secerisi. Ogorul era al lui Boaz, un om bun si bogat.',
      'Boaz a vazut-o si i-a spus: "Am auzit ce ai facut pentru soacra ta. Ramai aici, sa stranga oamenii mei pentru tine."',
      'Boaz s-a casatorit cu Rut. Au avut un fiu, Obed. Obed a fost bunicul lui David. Si din neamul lui David s-a nascut Iisus. Dumnezeu a tesut povestea unei straine intr-o linie de imparati.',
    ],
  },
  {
    id: 'samuel-chemat',
    order: 21,
    testament: 'vechi',
    titleRo: 'Samuel chemat de Dumnezeu',
    scriptureRef: '1 Samuel 3',
    summary: 'Un baietel a auzit primul un glas care a schimbat un popor.',
    accentColor: '#7986CB',
    templateSrc: null,
    paragraphs: [
      'Samuel era un baietel care slujea la cortul Domnului langa preotul Eli. Dormea aproape de chivot, in liniste.',
      'Intr-o noapte a auzit: "Samuel! Samuel!" A alergat la Eli: "Iata-ma, m-ai chemat?" "Nu, eu nu te-am chemat. Du-te, culca-te."',
      'S-a culcat. Glasul l-a chemat din nou. Si din nou Samuel s-a dus la Eli. A treia oara, Eli a inteles. "Daca te mai cheama, raspunde: Vorbeste, Doamne, ca slujitorul Tau asculta."',
      'Si asa a facut. Dumnezeu a vorbit cu Samuel pentru prima data. Samuel a ascultat. Toata viata lui de profet a inceput cu inima deschisa: "Vorbeste, Doamne."',
    ],
  },
  {
    id: 'david-goliat',
    order: 22,
    testament: 'vechi',
    titleRo: 'David si Goliat',
    scriptureRef: '1 Samuel 17',
    summary: 'Cinci pietre, o prastie si o credinta uriasa.',
    accentColor: '#7986CB',
    templateSrc: null,
    paragraphs: [
      'Filistenii aveau un urias: Goliat. Inalt de trei metri, in zale grele, striga in fiecare zi: "Cine indrazneste sa lupte cu mine?" Soldatii lui Saul tremurau.',
      'David era un baiat de pastorit. A venit la tabara cu mancare pentru fratii lui. A auzit blestemele lui Goliat. "Cine este acest necredincios sa sfideze ostirea Dumnezeului celui viu?"',
      '"Tu nu poti lupta cu el", a zis Saul. "Esti un copil." David a raspuns: "Am pazit oile de lei si urs. Domnul ma va pazi si acum."',
      'A luat doar prastia si cinci pietre netede din parau. Goliat a ras. David a aruncat o piatra. A lovit fruntea uriasului. Goliat s-a prabusit. Cu credinta in Dumnezeu, un baiat micut a doborat ce parea de neoprit.',
    ],
  },
  {
    id: 'david-ionatan',
    order: 23,
    testament: 'vechi',
    titleRo: 'David si Ionatan',
    scriptureRef: '1 Samuel 18-20',
    summary: 'Cea mai frumoasa prietenie din Vechiul Testament.',
    accentColor: '#7986CB',
    templateSrc: null,
    paragraphs: [
      'Saul, regele, a inceput sa-l urasca pe David. Dar fiul lui Saul, Ionatan, l-a iubit pe David ca pe propriul frate.',
      '"Tatal meu vrea sa te ucida", i-a spus Ionatan in taina. "Fugi! Te voi avertiza cand este pericol."',
      'Ionatan i-a daruit lui David haina lui regala, sabia si arcul. Au facut un legamant: "Fie ca Domnul sa fie martor intre mine si tine, intre urmasii mei si urmasii tai, in veac."',
      'Mai tarziu, cand Ionatan a murit in lupta, David a plans amar: "Vai, frate al meu Ionatan! Iubirea ta a fost mai pretioasa decat orice." Prietenia adevarata este un dar de la Dumnezeu, mai puternica decat sabia.',
    ],
  },
  {
    id: 'solomon-intelept',
    order: 24,
    testament: 'vechi',
    titleRo: 'Intelepciunea lui Solomon',
    scriptureRef: '1 Imparati 3',
    summary: 'A cerut intelepciune si a primit-o pe ea si toate cele.',
    accentColor: '#7986CB',
    templateSrc: null,
    paragraphs: [
      'Cand Solomon, fiul lui David, a ajuns rege, era inca tanar. Dumnezeu i s-a aratat in vis: "Cere ce vrei. Ti-Vom da."',
      'Solomon nu a cerut bogatii sau viata lunga. A cerut: "Da-mi un cuget intelept, sa stiu sa judec poporul Tau." Dumnezeu s-a bucurat: "Pentru ca ai cerut intelepciune, iti voi da si bogatie si slava."',
      'Curand, doua mame au venit la Solomon. Amandoua aveau un copil, dar unul murise. Fiecare zicea: "Copilul cel viu este al meu!"',
      'Solomon a poruncit: "Aduceti o sabie. Taiati copilul in doua." Adevarata mama a strigat: "Nu! Mai bine sa-l aiba ea!" Atunci Solomon a stiut adevarul si i-a dat copilul. Tot poporul s-a minunat — Dumnezeu pusese intelepciune in inima imparatului.',
    ],
  },
  {
    id: 'ilie-corbii',
    order: 25,
    testament: 'vechi',
    titleRo: 'Ilie si corbii',
    scriptureRef: '1 Imparati 17',
    summary: 'Pasari hraneau profetul intr-un timp de seceta.',
    accentColor: '#BA68C8',
    templateSrc: null,
    paragraphs: [
      'In zilele lui Ahab, regele cel rau, Israelul a uitat de Dumnezeu. Ilie, profetul Domnului, a stat in fata regelui: "Nu va ploua nici roua, pana nu voi spune eu."',
      'A inceput o seceta lunga. Toata tara s-a uscat. Ahab il cauta pe Ilie sa-l ucida. Dumnezeu i-a spus: "Du-te la paraul Cherit. Acolo te vei ascunde."',
      'La parau, Ilie bea apa. Pentru mancare, Dumnezeu a trimis corbi — pasari pe care nimeni nu le-ar fi crezut darnice. Dimineata aduceau paine, seara aduceau carne.',
      'Cand paraul s-a uscat, Dumnezeu l-a trimis la o vaduva saraca. Faina ei nu s-a sfarsit. Untdelemnul nu s-a ispravit. Dumnezeu hraneste, chiar si prin pasarile cerului.',
    ],
  },
  {
    id: 'ilie-carmel',
    order: 26,
    testament: 'vechi',
    titleRo: 'Ilie pe muntele Carmel',
    scriptureRef: '1 Imparati 18',
    summary: 'Foc din cer si o intoarcere a unui popor intreg.',
    accentColor: '#BA68C8',
    templateSrc: null,
    paragraphs: [
      'Profetii lui Baal erau 450. Ilie era singur. S-au adunat toti pe muntele Carmel. Ilie a strigat poporului: "Pana cand veti schiopata in doua parti? Daca Domnul este Dumnezeu, urmati-L! Daca este Baal, urmati-l pe el!"',
      'A propus o intrecere. "Sa aducem fiecare un vitel pe altar. Cine raspunde cu foc, El este Dumnezeu."',
      'Profetii lui Baal au strigat de dimineata pana seara: "Baale, raspunde-ne!" Au sarit, s-au taiat. Nimic. Cer tacut.',
      'Apoi Ilie a turnat apa peste altarul lui — patru, opt, douasprezece vedre, pana totul gemea de apa. A rostit o rugaciune scurta. Foc din cer a coborat. A mistuit jertfa, apa, pamantul. Poporul a cazut cu fata la pamant: "Domnul este Dumnezeu! Domnul este Dumnezeu!"',
    ],
  },
  {
    id: 'daniel-leii',
    order: 27,
    testament: 'vechi',
    titleRo: 'Daniel in groapa cu lei',
    scriptureRef: 'Daniel 6',
    summary: 'Leii infometati, gura inchisa de un inger.',
    accentColor: '#BA68C8',
    templateSrc: null,
    paragraphs: [
      'Daniel slujea cu credinta imparatul Darius si se ruga lui Dumnezeu de trei ori pe zi, cu fereastra deschisa spre Ierusalim.',
      'Cativa boieri il invidiau. L-au inselat pe imparat sa scrie o lege: "Cine se roaga la alt dumnezeu in afara de imparat sa fie aruncat in groapa cu lei."',
      'Daniel a citit legea — si a continuat sa se roage cum facuse. Boierii l-au prins. Imparatul, intristat, a fost silit sa-l arunce intre lei.',
      'Toata noaptea Darius nu a putut dormi. Dimineata a alergat la groapa: "Daniele, te-a izbavit Dumnezeul tau?" Daniel a raspuns: "Imparate, Dumnezeul meu a trimis pe ingerul Sau si a inchis gura leilor. Nu mi-au facut nimic." Darius a poruncit: "Toti din imparatia mea sa-L cinsteasca pe Dumnezeul lui Daniel!"',
    ],
  },
  {
    id: 'trei-tineri-cuptor',
    order: 28,
    testament: 'vechi',
    titleRo: 'Cei trei tineri in cuptor',
    scriptureRef: 'Daniel 3',
    summary: 'Foc de sapte ori inteit, dar Dumnezeu este cu ei.',
    accentColor: '#BA68C8',
    templateSrc: null,
    paragraphs: [
      'Imparatul Nabucodonosor a facut un chip de aur urias si a poruncit: "Cand suna muzica, toti sa se inchine!" Trei tineri evrei — Anania, Azaria si Misail — n-au vrut.',
      'Imparatul s-a maniat. "Va voi arunca in cuptorul de foc!" Au raspuns linistit: "Daca Dumnezeul nostru va vrea sa ne scape, El va putea. Daca nu, tot nu ne vom inchina la statuia ta."',
      'Cuptorul a fost inteit de sapte ori. Cei care i-au aruncat au murit de aratame. Cei trei au cazut in foc, legati.',
      'Imparatul s-a ridicat speriat: "Nu erau trei? Eu vad patru, si al patrulea seamana cu un fiu de Dumnezeu!" I-a chemat afara. Au iesit nevatamati — nici parul, nici hainele nu miroseau a fum. Dumnezeu este cu ai Sai chiar si in mijlocul focului.',
    ],
  },
  {
    id: 'iona-pestele',
    order: 29,
    testament: 'vechi',
    titleRo: 'Iona si pestele cel mare',
    scriptureRef: 'Iona 1-2',
    summary: 'Trei zile in burta unui peste si o cetate salvata.',
    accentColor: '#BA68C8',
    templateSrc: null,
    paragraphs: [
      'Dumnezeu i-a spus lui Iona: "Du-te in Ninive si striga impotriva relelor lor." Dar Iona nu a vrut. A fugit pe o corabie spre cealalta parte de lume.',
      'Pe mare s-a starnit o furtuna mare. Corabia era in primejdie. Marinarii s-au speriat. Iona a marturisit: "Eu fug de Dumnezeul meu. Aruncati-ma in mare si va veti salva."',
      'L-au aruncat. Marea s-a linistit. Dar Dumnezeu trimisese un peste mare. L-a inghitit pe Iona intreg.',
      'Trei zile si trei nopti Iona a stat in burta pestelui, rugandu-se. "Dumnezeule, izbaveste-ma!" Pestele l-a scuipat pe tarm. Iona a mers la Ninive. Toata cetatea s-a intors la Dumnezeu — si a fost crutata.',
    ],
  },
  {
    id: 'estera',
    order: 30,
    testament: 'vechi',
    titleRo: 'Estera, regina curajoasa',
    scriptureRef: 'Estera',
    summary: 'O regina evreica si-a riscat viata pentru poporul ei.',
    accentColor: '#BA68C8',
    templateSrc: null,
    paragraphs: [
      'Estera era o evreica frumoasa care a ajuns regina in Persia. Imparatul nu stia ca este evreica.',
      'Un boier rau, Haman, a uneltit sa-i piarda pe toti evreii. Mardoheu, unchiul Esterei, a aflat. "Trebuie sa mergi la imparat", i-a spus. "Cine stie daca nu de aceea ai ajuns regina, pentru o vreme ca aceasta?"',
      'Estera a postit trei zile. "Daca trebuie sa mor, voi muri", a spus, si a intrat la imparat fara sa fie chemata. Imparatul i-a aratat sceptrul de aur — semn ca o primeste.',
      'Estera a chemat imparatul si pe Haman la o masa. Cu lacrimi a marturisit: "Sunt evreica. Si poporul meu este vandut sa fie ucis." Imparatul s-a maniat pe Haman. Haman a fost spanzurat in locul unde ii pregatise spanzuratoare lui Mardoheu. Si poporul evreu a fost crutat.',
    ],
  },
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/stories.ts
git commit -m "Add OT stories 4-30 with Romanian retellings"
```

---

## Task 3: Add New Testament stories 31–50

**Files:**
- Modify: `lib/stories.ts` — append entries 31 through 50.

- [ ] **Step 1: Append NT stories 31–50**

Insert these entries inside `STORIES`, after the `estera` entry, before the closing `]`.

```ts
  {
    id: 'vestea-ingerului',
    order: 31,
    testament: 'nou',
    titleRo: 'Vestea ingerului',
    scriptureRef: 'Luca 1',
    summary: 'Gavriil aduce Mariei vestea cea mai uimitoare.',
    accentColor: '#FFE66D',
    templateSrc: null,
    paragraphs: [
      'In micul oras Nazaret traia o tanara fata, Maria. Era logodita cu Iosif, un dulgher.',
      'Intr-o zi, ingerul Gavriil a venit la ea. "Bucura-te, ceea ce esti plina de har! Domnul este cu tine."',
      'Maria s-a tulburat. Ingerul i-a spus: "Nu te teme, Maria. Vei naste un Fiu si Il vei numi Iisus. El va fi mare si Imparatia Lui nu va avea sfarsit."',
      '"Cum vor fi acestea?" a intrebat Maria. Ingerul a raspuns: "Duhul Sfant Se va pogori peste tine. Pruncul va fi numit Fiul lui Dumnezeu." Maria s-a inchinat: "Iata, sunt slujitoarea Domnului. Sa fie mie dupa cuvantul tau."',
    ],
  },
  {
    id: 'nasterea',
    order: 32,
    testament: 'nou',
    titleRo: 'Nasterea lui Iisus',
    scriptureRef: 'Luca 2',
    summary: 'Cea mai mare bucurie a lumii intr-un staul de animale.',
    accentColor: '#FFE66D',
    templateSrc: null,
    paragraphs: [
      'Cesarul August a poruncit ca toata lumea sa se inscrie. Iosif si Maria au plecat din Nazaret la Betleem, cetatea stramosilor lor.',
      'Cand au ajuns, Maria era gata sa nasca. Casele de oaspeti erau pline. Nu mai era loc nicaieri.',
      'Au gasit adapost intr-un staul, unde stateau animalele. Acolo, in liniste si saracie, s-a nascut Iisus. Maria L-a infasat in scutece si L-a culcat in iesle, intre vita si magarus.',
      'Cea mai mare bucurie a lumii a venit in cea mai smerita casa. Cerul atingea pamantul intr-un staul de animale.',
    ],
  },
  {
    id: 'magii',
    order: 33,
    testament: 'nou',
    titleRo: 'Magii din Rasarit',
    scriptureRef: 'Matei 2',
    summary: 'O stea i-a calauzit pe invatati pana la pruncul Imparat.',
    accentColor: '#FFE66D',
    templateSrc: null,
    paragraphs: [
      'Departe, in Rasarit, niste invatati au vazut o stea noua. Stiau ca inseamna nasterea unui mare Imparat. Au plecat sa-L caute, urmand steaua.',
      'Au ajuns la Ierusalim. "Unde este Imparatul iudeilor cel nascut?" au intrebat. Imparatul Irod a auzit si s-a tulburat. A spus magilor: "Mergeti la Betleem, si cand Il gasiti, spuneti-mi sa vin si eu sa I ma inchin." Dar in inima sa, voia sa-L omoare.',
      'Steaua i-a calauzit pana deasupra unei case. Au gasit Pruncul cu Maria, mama Lui. S-au inchinat si au deschis darurile: aur, tamaie si smirna.',
      'Un inger i-a avertizat in vis sa nu se intoarca la Irod. S-au intors pe alta cale. Iar Iosif a luat familia in Egipt, sa fereasca pe Iisus.',
    ],
  },
  {
    id: 'iisus-12-ani',
    order: 34,
    testament: 'nou',
    titleRo: 'Iisus la 12 ani in Templu',
    scriptureRef: 'Luca 2',
    summary: 'Un baiat de doisprezece ani uimea pe invatati.',
    accentColor: '#FFE66D',
    templateSrc: null,
    paragraphs: [
      'In fiecare an, familia mergea la Ierusalim de Pasti. Cand Iisus avea 12 ani, au mers ca de obicei.',
      'Dupa sarbatoare, parintii au pornit acasa. Iisus a ramas in Ierusalim, fara ca ei sa stie. Trei zile L-au cautat ingrijorati.',
      'L-au gasit in Templu, sezand printre invatatori. Asculta si punea intrebari. Toti se mirau de raspunsurile Lui.',
      '"Fiule, de ce ai facut asa cu noi? Iata, tatal tau si eu Te cautam ingrijorati", a spus Maria. Iisus a raspuns: "Nu stiati ca trebuie sa fiu in cele ale Tatalui Meu?" S-a intors cu ei la Nazaret si le era ascultator. Crestea in intelepciune si in har.',
    ],
  },
  {
    id: 'botezul',
    order: 35,
    testament: 'nou',
    titleRo: 'Botezul lui Iisus',
    scriptureRef: 'Matei 3',
    summary: 'Cerurile s-au deschis si Tatal a marturisit pe Fiul.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'Pe malul Iordanului propovaduia Ioan Botezatorul. Era imbracat in piele de camila si manca lacuste si miere salbatica. "Pocaiti-va! Imparatia cerurilor s-a apropiat!" striga.',
      'Lumea venea de pretutindeni. Ii boteza in apa Iordanului, in semn de pocainta.',
      'Intr-o zi, Iisus insusi a venit. Ioan s-a tulburat: "Eu am trebuinta sa fiu botezat de Tine, si Tu vii la mine?" Iisus a spus: "Lasa, asa ne se cuvine sa implinim toata dreptatea."',
      'Cand Iisus a iesit din apa, cerurile s-au deschis. Duhul Sfant a coborat ca un porumbel si a stat peste El. Si un glas din cer a spus: "Acesta este Fiul Meu cel iubit, intru Care am binevoit."',
    ],
  },
  {
    id: 'ispitirea',
    order: 36,
    testament: 'nou',
    titleRo: 'Ispitirea in pustie',
    scriptureRef: 'Matei 4',
    summary: 'Patruzeci de zile, trei ispite, o biruinta cu Cuvantul.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'Dupa botez, Iisus a fost dus de Duhul in pustie. A postit patruzeci de zile si patruzeci de nopti. I-a fost foame.',
      'Diavolul a venit sa-L ispiteasca. "Daca esti Fiul lui Dumnezeu, fa din pietrele acestea paine." Iisus a raspuns: "Scris este: nu numai cu paine va trai omul, ci cu tot cuvantul lui Dumnezeu."',
      'L-a dus pe varful Templului: "Arunca-Te jos. Ingerii Te vor purta pe maini." Iisus a zis: "Sa nu ispitesti pe Domnul Dumnezeul tau."',
      'L-a dus pe un munte inalt: "Toate imparatiile lumii ti le voi da, daca Te vei inchina mie." Iisus a strigat: "Inapoia Mea, satano! Domnului Dumnezeului tau sa te inchini, si Lui singur sa-I slujesti." Diavolul a fugit. Au venit ingerii si I-au slujit.',
    ],
  },
  {
    id: 'chemarea-ucenicilor',
    order: 37,
    testament: 'nou',
    titleRo: 'Chemarea ucenicilor',
    scriptureRef: 'Matei 4',
    summary: 'Pescari simpli au lasat totul si L-au urmat.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'Iisus mergea pe tarmul marii Galileii. A vazut doi frati, Petru si Andrei, aruncand naval. "Veniti dupa Mine. Va voi face pescari de oameni." I-au lasat mrejele si L-au urmat.',
      'Mai departe a vazut alti doi frati, Iacov si Ioan, in corabie cu tatal lor, dregand mrejele. I-a chemat. Si ei au lasat corabia si pe tatal lor si au mers cu El.',
      'Mai tarziu, a vazut pe Matei la vama. "Vino dupa Mine." Matei s-a sculat si L-a urmat. A facut un ospat mare in casa lui. Multi vamesi si pacatosi au mancat cu Iisus.',
      'Ucenicii erau doisprezece, oameni simpli — pescari, vamesi. Cu ei a inceput Iisus sa schimbe lumea.',
    ],
  },
  {
    id: 'nunta-cana',
    order: 38,
    testament: 'nou',
    titleRo: 'Nunta din Cana',
    scriptureRef: 'Ioan 2',
    summary: 'Apa s-a facut vin la prima minune a Domnului.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'A fost o nunta in Cana Galileii. Maria, mama lui Iisus, era acolo. Iisus si ucenicii Lui fusesera chemati.',
      'In mijlocul nuntii s-a sfarsit vinul. Maria i-a spus lui Iisus: "Nu mai au vin." El a raspuns: "Ce ai cu Mine, femeie? Inca nu a venit ceasul Meu." Maria le-a zis slugilor: "Faceti tot ce va va spune."',
      'Erau acolo sase vase mari de piatra, pentru curatire. Iisus a poruncit: "Umpleti vasele cu apa." Le-au umplut pana sus. "Acum scoateti si duceti nasului." Au scos.',
      'Apa se facuse vin, si vinul cel mai bun. Nasul s-a mirat: "De obicei se aduce mai intai vinul cel bun, iar mai pe urma cel slab. Tu ai pastrat vinul cel bun pana la sfarsit." Aceasta a fost prima minune a lui Iisus.',
    ],
  },
  {
    id: 'predica-munte',
    order: 39,
    testament: 'nou',
    titleRo: 'Predica de pe munte',
    scriptureRef: 'Matei 5-7',
    summary: 'Fericirile, lumina lumii si Tatal nostru.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'Multimile veneau dupa Iisus. S-a urcat intr-o zi pe un munte, S-a asezat, si i-a invatat:',
      '"Fericiti cei saraci cu duhul, ca a lor este Imparatia cerurilor. Fericiti cei ce plang, ca aceia se vor mangaia. Fericiti cei blanzi, ca aceia vor mosteni pamantul. Fericiti cei flamanzi si insetati de dreptate, ca aceia se vor satura."',
      '"Voi sunteti lumina lumii. Asa sa lumineze lumina voastra inaintea oamenilor, incat sa vada faptele voastre cele bune si sa slaveasca pe Tatal vostru Cel din ceruri."',
      'I-a invatat sa se roage: "Tatal nostru, Care esti in ceruri, sfinteasca-Se numele Tau, vie imparatia Ta..." Cuvintele acestea sunt rugaciunea pe care toti crestinii o rostesc pana azi.',
    ],
  },
  {
    id: 'furtuna-potolita',
    order: 40,
    testament: 'nou',
    titleRo: 'Iisus potoleste furtuna',
    scriptureRef: 'Matei 8',
    summary: 'Vantul si marea L-au ascultat.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'Intr-o seara, Iisus le-a spus ucenicilor: "Sa trecem de cealalta parte a marii." S-au urcat in corabie.',
      'Iisus dormea pe perna. S-a starnit o furtuna mare. Valurile loveau corabia, apa intra. Ucenicii s-au speriat. L-au trezit pe Iisus: "Invatatorule, nu-Ti pasa ca pierim?"',
      'Iisus s-a sculat. A certat vantul si a zis marii: "Taci! Inceteaza!" Dintr-o data vantul s-a oprit, si s-a facut liniste mare.',
      'Le-a zis ucenicilor: "De ce sunteti asa fricosi? Tot nu aveti credinta?" Ei s-au temut cu frica mare si ziceau intre ei: "Cine este Acesta, ca si vantul si marea Il asculta?"',
    ],
  },
  {
    id: 'inmultirea-painilor',
    order: 41,
    testament: 'nou',
    titleRo: 'Inmultirea painilor',
    scriptureRef: 'Ioan 6',
    summary: 'Cinci paini, doi pesti si cinci mii saturati.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'O multime mare urma pe Iisus. Cinci mii de barbati, pe langa femei si copii. Era seara si erau departe de sate.',
      '"Sa-i trimitem sa-si cumpere de mancare", au zis ucenicii. Iisus a spus: "Dati-le voi sa manance." "De unde? Doua sute de dinari nu ne-ar ajunge."',
      'Andrei a adus un baietel: "Are cinci paini de orz si doi pesti. Dar ce sunt acestea la atatia?"',
      'Iisus i-a pus pe oameni sa stea pe iarba. A luat painile, a multumit, le-a frant si le-a dat ucenicilor sa imparta. La fel si pestii. Toti au mancat si s-au saturat. Au strans douasprezece cosuri de firimituri. Cu putinul daruit lui Dumnezeu, El hraneste multimi.',
    ],
  },
  {
    id: 'umbla-pe-apa',
    order: 42,
    testament: 'nou',
    titleRo: 'Iisus umbla pe apa',
    scriptureRef: 'Matei 14',
    summary: 'Petru a pasit pe valuri si Iisus l-a apucat.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'Dupa minune, Iisus a trimis ucenicii in corabie sa treaca de cealalta parte. El S-a urcat pe munte sa Se roage.',
      'Pe la straja a patra a noptii, vantul era impotriva lor. Marea era invartita. Atunci au vazut ceva: o forma alba mergand pe apa. S-au speriat: "Este o naluca!"',
      'Era Iisus. Le-a zis: "Indrazniti! Eu sunt, nu va temeti!" Petru a zis: "Doamne, daca esti Tu, porunceste sa vin la Tine pe apa." "Vino", a spus Iisus.',
      'Petru a coborat din corabie si a inceput sa mearga pe apa. Dar vazand vantul, s-a infricoscat si a inceput sa se afunde. "Doamne, scapa-ma!" Iisus, intinzand mana, l-a apucat: "Putin credinciosule, pentru ce te-ai indoit?" Cand s-au suit in corabie, vantul a contenit.',
    ],
  },
  {
    id: 'pilda-semanator',
    order: 43,
    testament: 'nou',
    titleRo: 'Pilda semanatorului',
    scriptureRef: 'Matei 13',
    summary: 'Patru feluri de pamant, patru feluri de inima.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'Iisus invata pe oameni cu povesti, ca sa inteleaga mai usor. Intr-o zi a spus:',
      '"Iesit-a semanatorul sa semene samanta. O parte a cazut langa drum: au venit pasarile si au mancat-o. Alta a cazut pe pietre: a rasarit, dar fara radacina, s-a uscat la soare. Alta a cazut intre spini: spinii au inecat-o."',
      '"Dar alta samanta a cazut pe pamant bun. A crescut, a rodit, a dat unele 30, altele 60, altele 100."',
      'Ucenicii nu intelegeau. Iisus le-a explicat: "Samanta este Cuvantul lui Dumnezeu. Drumul, pietrele, spinii sunt inimile care nu primesc bine. Pamantul bun este inima care asculta, pastreaza si rodeste. Cum vrem sa fie inima noastra?"',
    ],
  },
  {
    id: 'samariteanul',
    order: 44,
    testament: 'nou',
    titleRo: 'Pilda samariteanului milostiv',
    scriptureRef: 'Luca 10',
    summary: 'Cine este aproapele meu? Cel care face mila.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'Un invatator de lege L-a intrebat pe Iisus: "Cine este aproapele meu?" Iisus a raspuns cu o poveste:',
      '"Un om mergea de la Ierusalim la Ierihon. A cazut intre talhari. L-au batut, l-au dezbracat, l-au lasat aproape mort pe drum."',
      '"A trecut un preot. L-a vazut si a trecut pe alta parte. A trecut un levit. La fel. Apoi a venit un samaritean — un strain. S-a oprit. Ii era mila. I-a turnat untdelemn si vin pe rani, l-a infasat. L-a urcat pe asinul lui si l-a dus la un han, unde a platit pentru el."',
      '"Care din cei trei a fost aproape al celui cazut intre talhari?" Invatatorul a raspuns: "Cel ce a facut mila cu el." Iisus i-a zis: "Du-te si fa si tu asemenea."',
    ],
  },
  {
    id: 'fiul-risipitor',
    order: 45,
    testament: 'nou',
    titleRo: 'Pilda fiului risipitor',
    scriptureRef: 'Luca 15',
    summary: 'Un tata aleargand, un fiu care s-a intors acasa.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'Un om avea doi feciori. Cel mic a zis tatalui sau: "Da-mi partea de mostenire." Tatal i-a dat. Tanarul s-a dus departe, intr-o tara straina, si a risipit tot.',
      'A venit o foamete. Era atat de sarac incat a ajuns sa pasca porci. Manca roscovele lor, dar nu se satura. Atunci si-a venit in fire: "Slugile tatalui meu au paine din belsug, iar eu pier de foame! Ma voi duce la tatal meu si-i voi spune: pacatuit-am!"',
      'S-a intors. Cand era inca departe, tatal sau l-a vazut. I s-a facut mila. A alergat la el, l-a imbratisat si l-a sarutat. "Tata, am pacatuit, nu mai sunt vrednic..." Tatal a strigat slugile: "Aduceti haina cea mai buna! Inelul! Incaltamintea! Sa facem ospat — fiul meu era pierdut si s-a aflat!"',
      'Asa este iubirea Tatalui ceresc: nu masoara, nu pedepseste, ci primeste cu bratele deschise pe oricine se intoarce.',
    ],
  },
  {
    id: 'iisus-copiii',
    order: 46,
    testament: 'nou',
    titleRo: 'Iisus si copiii',
    scriptureRef: 'Marcu 10',
    summary: 'Lasati copiii sa vina la Mine, a zis Domnul.',
    accentColor: '#4ECDC4',
    templateSrc: null,
    paragraphs: [
      'I se aduceau lui Iisus copii mici, sa puna mana peste ei si sa-i binecuvanteze. Ucenicii ii certau pe parinti: "Nu deranjati pe Invatatorul!"',
      'Iisus a vazut si S-a maniat. "Lasati copiii sa vina la Mine si nu-i opriti. Ca a unora ca acestia este Imparatia cerurilor."',
      '"Adevarat va spun: oricine nu va primi Imparatia lui Dumnezeu ca un copilas, nu va intra in ea."',
      'A luat copiii in brate. Punea mainile peste ei si ii binecuvanta. Inima curata a unui copil ii este lui Dumnezeu mai placuta decat toata invatatura lumii.',
    ],
  },
  {
    id: 'intrarea-ierusalim',
    order: 47,
    testament: 'nou',
    titleRo: 'Intrarea in Ierusalim',
    scriptureRef: 'Matei 21',
    summary: 'Imparatul a venit smerit, calare pe un manz.',
    accentColor: '#FFE66D',
    templateSrc: null,
    paragraphs: [
      'Iisus mergea spre Ierusalim. A trimis doi ucenici: "Veti gasi un manz legat. Dezlegati-l si aduceti-l." L-au adus.',
      'Au pus hainele lor peste manz. Iisus S-a urcat. A inceput sa coboare de pe muntele Maslinilor.',
      'Multime mare se strangea. Asterneau hainele pe drum. Taiau ramuri de finic si le agitau. Strigau: "Osana Fiului lui David! Binecuvantat este Cel ce vine intru numele Domnului!"',
      'A intrat in Ierusalim ca Imparat smerit, calare pe un manz, asa cum profetii prevestisera. Copiii din Templu cantau si strigau dupa El. Imparatul lumii a venit nu pe cal de razboi, ci pe asin de pace.',
    ],
  },
  {
    id: 'cina-de-taina',
    order: 48,
    testament: 'nou',
    titleRo: 'Cina cea de Taina',
    scriptureRef: 'Matei 26',
    summary: 'Painea si paharul daruite ucenicilor pentru veci.',
    accentColor: '#E55A5A',
    templateSrc: null,
    paragraphs: [
      'Era seara dinaintea Pastelui. Iisus a stat la masa cu cei doisprezece ucenici. Le-a spalat picioarele, ca un slujitor.',
      '"Unul dintre voi Ma va vinde", a zis. Toti s-au tulburat: "Doar nu eu, Doamne?" Iuda L-a vandut pentru treizeci de arginti.',
      'Iisus a luat painea, a multumit, a frant si le-a dat: "Luati, mancati. Acesta este Trupul Meu." A luat paharul, a multumit si li l-a dat: "Beti dintru acesta toti. Acesta este Sangele Meu, al Legii celei noi, care pentru voi se varsa."',
      '"Aceasta sa o faceti spre pomenirea Mea." De atunci, in fiecare biserica, crestinii fac la fel. La aceasta masa Iisus Si-a daruit pe Sine — paine de viata pentru toti.',
    ],
  },
  {
    id: 'rastignirea',
    order: 49,
    testament: 'nou',
    titleRo: 'Rastignirea',
    scriptureRef: 'Ioan 19',
    summary: 'Pe cruce, Iisus si-a daruit viata pentru lume.',
    accentColor: '#E55A5A',
    templateSrc: null,
    paragraphs: [
      'Iisus a fost prins in gradina Ghetsimani. L-au dus la Pilat. Multimea striga: "Rastigneste-L!"',
      'Pilat L-a osandit. I-au pus o cununa de spini pe cap. L-au batut. Au facut o cruce mare si au pus-o pe umerii Lui sa o duca pe Golgota.',
      'L-au rastignit intre doi talhari. Mama Lui statea langa cruce, plangand. Iisus i-a zis ucenicului Ioan: "Iata mama ta!" Si lui Ioan: "Iata fiul tau!"',
      'A spus: "Tata, iarta-le, ca nu stiu ce fac." Si: "Sa-varsitu-s-a." Si-a dat duhul. Pamantul s-a cutremurat. Catapeteasma templului s-a rupt in doua. Sutasul roman a marturisit: "Cu adevarat, Acesta a fost Fiul lui Dumnezeu." Iisus a primit moartea pentru ca noi sa avem viata.',
    ],
  },
  {
    id: 'invierea',
    order: 50,
    testament: 'nou',
    titleRo: 'Invierea Domnului',
    scriptureRef: 'Matei 28',
    summary: 'Mormantul gol si bucuria care nu se sfarseste.',
    accentColor: '#FFE66D',
    templateSrc: null,
    paragraphs: [
      'Era duminica dimineata, devreme. Doua femei au mers la mormantul lui Iisus, cu inima trista. Au adus mirodenii ca sa Il cinsteasca.',
      'Cand au ajuns, au vazut ceva uimitor: piatra cea mare de la intrarea mormantului fusese rostogolita la o parte. Un inger stralucitor sedea acolo. "Nu va temeti!" le-a spus. "Iisus nu este aici. A inviat, asa cum a spus!"',
      'Femeile au fugit acasa pline de bucurie sa le spuna ucenicilor. Pe drum, Iisus insusi le-a iesit in fata. "Bucurati-va!" le-a zis. Era viu, cu adevarat viu!',
      'Mai tarziu, ucenicii L-au vazut si ei. Iisus i-a trimis sa duca vestea cea buna in toata lumea. Si le-a fagaduit: "Iata, Eu sunt cu voi in toate zilele, pana la sfarsitul veacului."',
    ],
  },
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Sanity-check the count**

Run: `pnpm exec node -e "import('./lib/stories.ts').then(m => console.log(m.STORIES.length))"`
Expected: `50`

(Or open the file and visually confirm orders 1..50 are all present.)

- [ ] **Step 4: Commit**

```bash
git add lib/stories.ts
git commit -m "Add NT stories 31-50 with Romanian retellings"
```

---

## Task 4: Install `idb` dependency

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install**

Run: `pnpm add idb`
Expected: package added to `dependencies`, lock file updated.

- [ ] **Step 2: Verify installation**

Run: `pnpm list idb`
Expected: prints something like `idb 8.x.x`.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "Add idb dependency for IndexedDB persistence"
```

---

## Task 5: lib/progress.ts — IndexedDB wrapper

**Files:**
- Create: `lib/progress.ts`

- [ ] **Step 1: Create the file**

```ts
'use client'

import { openDB, type IDBPDatabase } from 'idb'
import { getStoryByOrder, getAllStories } from './stories'

export type StoryStatus = 'locked' | 'available' | 'in-progress' | 'done'

interface ProgressRecord {
  status: Exclude<StoryStatus, 'locked'>
  updatedAt: number
}

interface RizaSchema {
  progress: { key: string; value: ProgressRecord }
  canvases: { key: string; value: Blob }
}

const DB_NAME = 'riza'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<RizaSchema>> | null = null

function getDb() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('progress is browser-only'))
  }
  if (!dbPromise) {
    dbPromise = openDB<RizaSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress')
        }
        if (!db.objectStoreNames.contains('canvases')) {
          db.createObjectStore('canvases')
        }
      },
    })
  }
  return dbPromise
}

export async function getStatus(id: string): Promise<StoryStatus> {
  const story = getAllStories().find((s) => s.id === id)
  if (!story) return 'locked'

  const db = await getDb()
  const record = await db.get('progress', id)
  if (record) return record.status

  // No explicit record → check the previous story
  if (story.order === 1) return 'available'
  const prev = getStoryByOrder(story.order - 1)
  if (!prev) return 'available'
  const prevRecord = await db.get('progress', prev.id)
  if (prevRecord?.status === 'done') return 'available'
  return 'locked'
}

export async function loadAllStatuses(): Promise<Map<string, StoryStatus>> {
  const result = new Map<string, StoryStatus>()
  const stories = getAllStories()
  const db = await getDb()
  const records = new Map<string, ProgressRecord>()
  for (const story of stories) {
    const r = await db.get('progress', story.id)
    if (r) records.set(story.id, r)
  }
  for (const story of stories) {
    const explicit = records.get(story.id)
    if (explicit) {
      result.set(story.id, explicit.status)
      continue
    }
    if (story.order === 1) {
      result.set(story.id, 'available')
      continue
    }
    const prev = getStoryByOrder(story.order - 1)
    const prevExplicit = prev ? records.get(prev.id) : undefined
    result.set(
      story.id,
      prevExplicit?.status === 'done' ? 'available' : 'locked'
    )
  }
  return result
}

export async function setStatus(
  id: string,
  status: Exclude<StoryStatus, 'locked'>
): Promise<void> {
  const db = await getDb()
  await db.put(
    'progress',
    { status, updatedAt: Date.now() },
    id
  )
}

export async function markDone(id: string): Promise<void> {
  await setStatus(id, 'done')
  const story = getAllStories().find((s) => s.id === id)
  if (!story) return
  const next = getStoryByOrder(story.order + 1)
  if (!next) return
  const db = await getDb()
  const existing = await db.get('progress', next.id)
  if (!existing) {
    await setStatus(next.id, 'available')
  }
}

export async function saveCanvas(id: string, blob: Blob): Promise<void> {
  const db = await getDb()
  await db.put('canvases', blob, id)
  // First save flips status from available → in-progress
  const existing = await db.get('progress', id)
  if (!existing) {
    await setStatus(id, 'in-progress')
  }
}

export async function loadCanvas(id: string): Promise<Blob | null> {
  const db = await getDb()
  const blob = await db.get('canvases', id)
  return blob ?? null
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/progress.ts
git commit -m "IndexedDB progress + canvas persistence via idb"
```

---

## Task 6: KidCanvas — `initialImageBlob` and `onCanvasIdle`

**Files:**
- Modify: `components/kid-canvas.tsx`

The canvas gains two additive props. `initialImageBlob` is consumed once on mount to restore a saved drawing. `onCanvasIdle` is debounced 1 s after the last stroke and receives a PNG `Blob`.

- [ ] **Step 1: Update the props interface**

In `components/kid-canvas.tsx`, find the existing `KidCanvasProps` and replace it:

```ts
interface KidCanvasProps {
  tool: Tool
  color: string
  brushSize: number
  templateSrc?: string | null
  stampSrc?: string | null
  onStampPlaced?: () => void
  disabled?: boolean
  initialImageBlob?: Blob | null
  onCanvasIdle?: (blob: Blob) => void
}
```

- [ ] **Step 2: Update the component signature**

Find the destructuring inside the `forwardRef` callback and replace it:

```ts
export const KidCanvas = forwardRef<KidCanvasRef, KidCanvasProps>(
  function KidCanvas(
    {
      tool,
      color,
      brushSize,
      templateSrc,
      stampSrc,
      onStampPlaced,
      disabled = false,
      initialImageBlob,
      onCanvasIdle,
    },
    ref
  ) {
```

- [ ] **Step 3: Add a ref for the idle timer + a restored flag**

Inside the component body, near the other `useRef` calls, add:

```ts
const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
const restoredRef = useRef(false)
```

- [ ] **Step 4: Add an effect that restores `initialImageBlob` on first mount with a context**

Add this effect after the `useEffect` that loads `templateSrc`:

```ts
useEffect(() => {
  if (!initialImageBlob || restoredRef.current) return
  const ctx = ctxRef.current
  const canvas = canvasRef.current
  if (!ctx || !canvas) return

  const img = new Image()
  const url = URL.createObjectURL(initialImageBlob)
  img.onload = () => {
    const rect = canvas.getBoundingClientRect()
    ctx.drawImage(img, 0, 0, rect.width, rect.height)
    URL.revokeObjectURL(url)
    restoredRef.current = true
  }
  img.src = url
}, [initialImageBlob])
```

- [ ] **Step 5: Add a helper that schedules the idle callback**

Below `effectiveBrushSize`, add:

```ts
const scheduleIdleSave = () => {
  if (!onCanvasIdle) return
  if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
  idleTimerRef.current = setTimeout(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (blob) onCanvasIdle(blob)
    }, 'image/png')
  }, 1000)
}
```

- [ ] **Step 6: Call `scheduleIdleSave` after every meaningful change**

Find `handlePointerUp`. Replace it:

```ts
const handlePointerUp = () => {
  if (isDrawing) {
    setIsDrawing(false)
    lastPointRef.current = null
    scheduleIdleSave()
  }
}
```

Find the `placeStamp` function and add `scheduleIdleSave()` at the end (just below `onStampPlaced?.()`).

Find the `floodFill` call inside `handlePointerDown` and call `scheduleIdleSave()` after it (after `floodFill(...)` and before the `return`):

```ts
if (tool === 'fill') {
  saveToUndoStack()
  floodFill(pos.x, pos.y, color)
  scheduleIdleSave()
  return
}
```

Inside `useImperativeHandle`, add `scheduleIdleSave()` to the end of both `undo()` and `clear()` so the persisted blob never lags behind the visible canvas:

```ts
useImperativeHandle(ref, () => ({
  undo: () => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas || undoStack.length === 0) return
    setUndoStack((prev) => {
      const newStack = [...prev]
      const imageData = newStack.pop()
      if (imageData) {
        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.putImageData(imageData, 0, 0)
        ctx.restore()
      }
      return newStack
    })
    scheduleIdleSave()
  },
  clear: () => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    saveToUndoStack()
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, rect.width, rect.height)
    scheduleIdleSave()
  },
  canUndo: () => undoStack.length > 0,
  getImageDataUrl: () => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = canvas.width
    exportCanvas.height = canvas.height
    const exportCtx = exportCanvas.getContext('2d')
    if (!exportCtx) return null

    exportCtx.drawImage(canvas, 0, 0)

    const tplImg = templateImgRef.current
    if (tplImg) {
      const r = getTemplateRect(
        tplImg.width,
        tplImg.height,
        canvas.width,
        canvas.height
      )
      exportCtx.globalCompositeOperation = 'multiply'
      exportCtx.drawImage(tplImg, r.x, r.y, r.w, r.h)
      exportCtx.globalCompositeOperation = 'source-over'
    }

    return exportCanvas.toDataURL('image/png')
  },
}))
```

- [ ] **Step 7: Cleanup the idle timer on unmount**

Below the existing effects, add:

```ts
useEffect(() => {
  return () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
  }
}, [])
```

- [ ] **Step 8: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 9: Smoke test — existing /desen still works**

Run `pnpm dev` (if not already running). Navigate to `/desen?mode=blank`, draw a few strokes, switch tools, undo, clear with the confirmation dialog, save. Everything should behave exactly as before — `initialImageBlob` is undefined, `onCanvasIdle` is undefined, both are inert.

- [ ] **Step 10: Commit**

```bash
git add components/kid-canvas.tsx
git commit -m "KidCanvas: restore from blob + debounced idle save"
```

---

## Task 7: components/story-checkpoint.tsx

**Files:**
- Create: `components/story-checkpoint.tsx`

A single timeline checkpoint. Receives the story, its computed status, and the optional canvas blob (for in-progress/done thumbnails).

- [ ] **Step 1: Create the file**

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Lock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Story } from '@/lib/stories'
import { type StoryStatus } from '@/lib/progress'

interface StoryCheckpointProps {
  story: Story
  status: StoryStatus
  canvasBlob: Blob | null
  isCurrent: boolean
  onLockedTap: () => void
}

export function StoryCheckpoint({
  story,
  status,
  canvasBlob,
  isCurrent,
  onLockedTap,
}: StoryCheckpointProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasBlob) {
      setThumbUrl(null)
      return
    }
    const url = URL.createObjectURL(canvasBlob)
    setThumbUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [canvasBlob])

  const sideOffset = story.order % 2 === 1 ? 'self-start ml-[8%]' : 'self-end mr-[8%]'

  if (status === 'locked') {
    return (
      <div className={cn('flex flex-col items-center', sideOffset)}>
        <button
          onClick={onLockedTap}
          aria-label={`${story.titleRo} (blocata)`}
          className="relative w-20 h-20 rounded-full bg-muted/40 flex items-center justify-center opacity-50 hover:opacity-60 transition-opacity"
        >
          <Lock className="w-7 h-7 text-muted-foreground" />
        </button>
        <p className="text-sm text-muted-foreground/70 mt-2 text-center max-w-[140px] truncate">
          {story.titleRo}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center', sideOffset)}>
      <Link
        href={`/povesti/${story.id}`}
        aria-label={story.titleRo}
        className={cn(
          'relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-4 bg-white transition-transform hover:scale-105 active:scale-95',
          status === 'available' && 'animate-[pulse_2.4s_ease-in-out_infinite]',
          isCurrent && 'ring-4 ring-offset-2 ring-offset-background'
        )}
        style={{
          borderColor: story.accentColor,
          boxShadow: `0 0 24px ${story.accentColor}55`,
        }}
      >
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="font-display text-2xl font-bold"
            style={{ color: story.accentColor }}
          >
            {story.order}
          </span>
        )}
        {status === 'done' && (
          <span
            className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-yellow flex items-center justify-center"
            aria-hidden
          >
            <Star className="w-4 h-4 fill-foreground text-foreground" />
          </span>
        )}
      </Link>
      <p className="text-sm font-medium text-foreground mt-2 text-center max-w-[140px] truncate">
        {story.titleRo}
      </p>
      <p className="text-xs text-muted-foreground text-center max-w-[140px] truncate">
        {story.scriptureRef}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/story-checkpoint.tsx
git commit -m "StoryCheckpoint: timeline node with status + thumbnail"
```

---

## Task 8: app/povesti/page.tsx — landing with magic timeline

**Files:**
- Create: `app/povesti/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'
import { FloatingTopBar } from '@/components/floating-top-bar'
import { StoryCheckpoint } from '@/components/story-checkpoint'
import { getAllStories, type Story } from '@/lib/stories'
import {
  loadAllStatuses,
  loadCanvas,
  type StoryStatus,
} from '@/lib/progress'

function PovestiContent() {
  const stories = getAllStories()
  const router = useRouter()
  const searchParams = useSearchParams()
  const completedId = searchParams.get('completed')

  const [statuses, setStatuses] = useState<Map<string, StoryStatus>>(new Map())
  const [thumbs, setThumbs] = useState<Map<string, Blob>>(new Map())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadAllStatuses().then(async (map) => {
      if (cancelled) return
      setStatuses(map)
      const blobs = new Map<string, Blob>()
      for (const story of stories) {
        const s = map.get(story.id)
        if (s === 'in-progress' || s === 'done') {
          const blob = await loadCanvas(story.id)
          if (blob) blobs.set(story.id, blob)
        }
      }
      if (!cancelled) {
        setThumbs(blobs)
        setLoaded(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [stories])

  // Find first 'available' (the "you are here") for current marker.
  const currentId =
    stories.find((s) => statuses.get(s.id) === 'available')?.id ?? null

  useEffect(() => {
    if (!completedId) return
    // Scroll to the just-completed checkpoint, then drop the query string.
    const el = document.getElementById(`checkpoint-${completedId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    const timer = setTimeout(() => {
      router.replace('/povesti')
    }, 1800)
    return () => clearTimeout(timer)
  }, [completedId, router])

  const handleLockedTap = () => {
    toast('Termina povestea anterioara mai intai!', { duration: 2000 })
  }

  return (
    <main
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top, #FFF4D6 0%, #F5E6BC 60%, #E8D69E 100%)',
      }}
    >
      <FloatingTopBar title="Povesti din Biblie" />

      {/* Decorative twinkles */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-yellow-light/70"
            style={{
              left: `${(i * 37) % 90 + 5}%`,
              top: `${(i * 91) % 100}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="pt-24 pb-16 max-w-3xl mx-auto px-4 flex flex-col gap-12 relative">
        {!loaded && (
          <div className="flex justify-center py-12">
            <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {loaded && stories.map((story, idx) => (
          <div key={story.id} id={`checkpoint-${story.id}`}>
            {idx === 30 && (
              <div className="text-center py-6">
                <h2 className="font-display text-2xl text-foreground/80">
                  Noul Testament
                </h2>
                <div
                  aria-hidden
                  className="mx-auto mt-2 h-px w-32 bg-foreground/20"
                />
              </div>
            )}
            <StoryCheckpoint
              story={story}
              status={statuses.get(story.id) ?? 'locked'}
              canvasBlob={thumbs.get(story.id) ?? null}
              isCurrent={currentId === story.id}
              onLockedTap={handleLockedTap}
            />
          </div>
        ))}
      </div>
      <Toaster position="top-center" />
    </main>
  )
}

export default function PovestiPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <PovestiContent />
    </Suspense>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Smoke test**

Visit `/povesti`. Confirm:
- The page loads with parchment-amber gradient and twinkles.
- Story 1 (Creatia lumii) is brightly visible with a pulsing ring; all others are locked (lock icon).
- Tapping a locked checkpoint shows a sonner toast "Termina povestea anterioara mai intai!"
- Tapping story 1 navigates to `/povesti/creatie` (next task — currently 404).

- [ ] **Step 4: Commit**

```bash
git add app/povesti/page.tsx
git commit -m "Bible-stories landing: magic timeline with locked checkpoints"
```

---

## Task 9: components/story-panel.tsx

**Files:**
- Create: `components/story-panel.tsx`

The story panel rendered inside the detail page. Used directly on tablet (right column) and inside the mobile bottom-sheet drawer.

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { Sparkles } from 'lucide-react'
import { type Story } from '@/lib/stories'

interface StoryPanelProps {
  story: Story
  onDone: () => void
  doneDisabled?: boolean
}

export function StoryPanel({ story, onDone, doneDisabled = false }: StoryPanelProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      <header
        className="px-5 py-4 text-white"
        style={{ backgroundColor: story.accentColor }}
      >
        <h1 className="font-display text-xl font-bold">{story.titleRo}</h1>
        <p className="text-sm opacity-90">{story.scriptureRef}</p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {story.paragraphs.map((p, i) => (
          <p key={i} className="text-base leading-relaxed text-foreground">
            {p}
          </p>
        ))}
      </div>

      <div className="p-4 border-t border-border/50">
        <button
          onClick={onDone}
          disabled={doneDisabled}
          className="w-full h-12 rounded-full font-display text-lg font-bold bg-mint hover:bg-mint-dark text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="w-5 h-5" />
          Gata!
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/story-panel.tsx
git commit -m "StoryPanel: title + paragraphs + Gata! button"
```

---

## Task 10: app/povesti/[storyId]/page.tsx — story detail

**Files:**
- Create: `app/povesti/[storyId]/page.tsx`

This page wires the canvas + story panel together, handles auto-save and restore via `lib/progress`, and ships the "Gata!" completion flow.

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { FloatingTopBar } from '@/components/floating-top-bar'
import { FloatingToolbar, type Tool } from '@/components/floating-toolbar'
import { StampSidebar } from '@/components/stamp-sidebar'
import { KidCanvas, type KidCanvasRef } from '@/components/kid-canvas'
import { SaveShareSheet } from '@/components/save-share-sheet'
import { StoryPanel } from '@/components/story-panel'
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useIsMobile } from '@/hooks/use-mobile'
import { type Stamp } from '@/lib/templates'
import { getStoryById } from '@/lib/stories'
import {
  getStatus,
  loadCanvas,
  saveCanvas,
  markDone,
} from '@/lib/progress'
import { cn } from '@/lib/utils'

function StoryDetailContent() {
  const params = useParams<{ storyId: string }>()
  const router = useRouter()
  const isMobile = useIsMobile()

  const story = getStoryById(params.storyId)

  const canvasRef = useRef<KidCanvasRef>(null)
  const [tool, setTool] = useState<Tool>('brush')
  const [color, setColor] = useState('#FF6B6B')
  const [brushSize, setBrushSize] = useState(16)
  const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [showSaveSheet, setShowSaveSheet] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [showStampSidebar, setShowStampSidebar] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showStoryDrawer, setShowStoryDrawer] = useState(false)
  const [initialBlob, setInitialBlob] = useState<Blob | null | undefined>(undefined)
  const [accessChecked, setAccessChecked] = useState(false)

  // Access check: if locked, redirect.
  useEffect(() => {
    if (!story) {
      router.replace('/povesti')
      return
    }
    let cancelled = false
    getStatus(story.id).then((s) => {
      if (cancelled) return
      if (s === 'locked') {
        router.replace('/povesti')
        return
      }
      setAccessChecked(true)
    })
    return () => {
      cancelled = true
    }
  }, [story, router])

  // Restore canvas blob once access is confirmed
  useEffect(() => {
    if (!accessChecked || !story) return
    let cancelled = false
    loadCanvas(story.id).then((blob) => {
      if (!cancelled) setInitialBlob(blob)
    })
    return () => {
      cancelled = true
    }
  }, [accessChecked, story])

  useEffect(() => {
    const interval = setInterval(() => {
      if (canvasRef.current) setCanUndo(canvasRef.current.canUndo())
    }, 100)
    return () => clearInterval(interval)
  }, [])

  if (!story || !accessChecked || initialBlob === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    if (tool === 'stamp' || tool === 'eraser') setTool('brush')
  }
  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size)
    if (tool === 'stamp' || tool === 'fill') setTool('brush')
  }

  const handleUndo = () => canvasRef.current?.undo()
  const handleClear = () => setShowClearConfirm(true)
  const handleConfirmClear = () => {
    canvasRef.current?.clear()
    setShowClearConfirm(false)
  }
  const handleSave = () => {
    const dataUrl = canvasRef.current?.getImageDataUrl()
    if (dataUrl) {
      setImageDataUrl(dataUrl)
      setShowSaveSheet(true)
    }
  }

  const handleCanvasIdle = (blob: Blob) => {
    saveCanvas(story.id, blob).catch(() => {})
  }

  const handleDone = async () => {
    // Snapshot now (in case there are unsaved strokes).
    const dataUrl = canvasRef.current?.getImageDataUrl()
    if (dataUrl) {
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      await saveCanvas(story.id, blob)
    }
    await markDone(story.id)
    router.push(`/povesti?completed=${story.id}`)
  }

  const handleSelectStamp = (stamp: Stamp | null) => {
    setSelectedStamp(stamp)
    if (stamp) setShowStampSidebar(false)
  }

  const stampSrc = tool === 'stamp' ? selectedStamp?.src ?? null : null
  const canvasDisabled = tool === 'stamp' && !selectedStamp

  return (
    <div className="h-screen flex bg-background overflow-hidden relative">
      <FloatingTopBar title={story.titleRo} backHref="/povesti" />

      {/* Canvas area — fills remaining space */}
      <div className="flex-1 flex flex-col relative">
        <KidCanvas
          ref={canvasRef}
          tool={tool}
          color={color}
          brushSize={brushSize}
          templateSrc={story.templateSrc}
          stampSrc={stampSrc}
          disabled={canvasDisabled}
          initialImageBlob={initialBlob}
          onCanvasIdle={handleCanvasIdle}
        />

        {/* Mobile-only: floating "Citeste povestea" button */}
        {isMobile && (
          <button
            onClick={() => setShowStoryDrawer(true)}
            className="fixed top-20 left-4 z-30 floating-toolbar px-4 py-2 flex items-center gap-2 text-sm font-medium text-foreground"
            aria-label="Citeste povestea"
          >
            <BookOpen className="w-4 h-4" />
            Povestea
          </button>
        )}

        <FloatingToolbar
          activeTool={tool}
          onToolChange={setTool}
          activeColor={color}
          onColorChange={handleColorChange}
          brushSize={brushSize}
          onBrushSizeChange={handleBrushSizeChange}
          onUndo={handleUndo}
          onClear={handleClear}
          onSave={handleSave}
          onShowStamps={() => setShowStampSidebar(true)}
          canUndo={canUndo}
          hidden={showStampSidebar || showStoryDrawer}
        />
      </div>

      {/* Tablet/desktop story panel */}
      {!isMobile && (
        <aside className="w-[340px] border-l border-border/50 shrink-0">
          <StoryPanel story={story} onDone={handleDone} />
        </aside>
      )}

      {/* Mobile story drawer */}
      {isMobile && (
        <Drawer
          open={showStoryDrawer}
          onOpenChange={setShowStoryDrawer}
        >
          <DrawerContent className="max-h-[85vh] rounded-t-3xl bg-white">
            <DrawerTitle className="sr-only">{story.titleRo}</DrawerTitle>
            <div className="flex-1 overflow-hidden">
              <StoryPanel
                story={story}
                onDone={async () => {
                  setShowStoryDrawer(false)
                  await handleDone()
                }}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <StampSidebar
        isOpen={showStampSidebar}
        onClose={() => {
          setShowStampSidebar(false)
          if (tool === 'stamp' && !selectedStamp) setTool('brush')
        }}
        onSelectStamp={handleSelectStamp}
        selectedStampId={selectedStamp?.id}
      />

      <SaveShareSheet
        open={showSaveSheet}
        onOpenChange={setShowSaveSheet}
        imageDataUrl={imageDataUrl}
        onContinue={() => setShowSaveSheet(false)}
      />

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">
              Stergi tot desenul?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Vei pierde ce ai desenat pana acum. Esti sigur?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 rounded-full font-display text-base">
              Nu, pastreaza
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClear}
              className={cn(
                'h-12 rounded-full font-display text-base bg-coral hover:bg-coral-dark'
              )}
            >
              Da, sterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function StoryDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <StoryDetailContent />
    </Suspense>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Smoke test — desktop**

Run `pnpm dev`. Navigate to `/povesti/creatie`. Confirm:
- Canvas on the left, story panel (with title bar in the story's accent color) on the right at desktop widths.
- Drawing strokes work; switching tools, undo, fill, save all behave like `/desen`.
- After ~1.5 s of inactivity, the canvas auto-saves (no visible UI; check IndexedDB in DevTools → Application → IndexedDB → `riza` → `canvases`).
- Reload the page; the previous strokes restore.

- [ ] **Step 4: Smoke test — Gata!**

Tap the "Gata!" button. Should navigate back to `/povesti?completed=creatie` and the page scrolls to the just-completed checkpoint, which now shows the colored thumbnail. Story 2 (Adam si Eva) should now be available (pulsing).

- [ ] **Step 5: Smoke test — locked redirect**

Visit `/povesti/invierea` (story 50, still locked). Should redirect to `/povesti`.

- [ ] **Step 6: Smoke test — mobile**

Resize the viewport to 360 × 740. The canvas now fills the screen. The story panel disappears; tap "Povestea" pill (top-left) → bottom-sheet drawer opens with the story. Tap "Gata!" inside the sheet → completes and navigates back.

- [ ] **Step 7: Commit**

```bash
git add app/povesti/[storyId]/page.tsx
git commit -m "Story detail page: canvas + side panel/drawer + auto-save"
```

---

## Task 11: Add Povesti card to home page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update imports and JSX**

Edit `app/page.tsx`. Update the lucide import to include `BookOpen`:

```tsx
import { Paintbrush, Palette, BookOpen } from 'lucide-react'
```

Inside the `<section>` containing the grid, replace the inner block with:

```tsx
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4 max-w-lg mx-auto">
          <ModeCard
            href="/desen?mode=blank"
            icon={<Paintbrush className="size-8 text-white" />}
            title="Deseneaza"
            description="Foaie goala"
            bgClass="bg-gradient-to-br from-coral to-coral-dark"
            delay={0}
          />

          <ModeCard
            href="/desen?mode=colorat"
            icon={<Palette className="size-8 text-white" />}
            title="Coloreaza"
            description="Alege un desen"
            bgClass="bg-gradient-to-br from-mint to-mint-dark"
            delay={80}
          />

          <ModeCard
            href="/povesti"
            icon={<BookOpen className="size-8 text-foreground" />}
            title="Povesti din Biblie"
            description="Coloreaza si invata"
            bgClass="bg-gradient-to-br from-yellow to-yellow-dark min-[420px]:col-span-2"
            textClass="text-foreground"
            delay={160}
          />
        </div>
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Smoke test**

Visit `/`. Confirm:
- Three cards: "Deseneaza", "Coloreaza", and "Povesti din Biblie".
- The third card spans full width below the first two on viewports ≥ 420 px.
- Tapping it navigates to `/povesti`.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "Home: add Povesti din Biblie card linking to /povesti"
```

---

## Task 12: Final verification

**Files:** none modified.

- [ ] **Step 1: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected: all routes prerender, including `/povesti` and `/povesti/[storyId]`. No errors.

- [ ] **Step 3: DevTools breakpoint walkthrough**

`pnpm dev`. Walk through both breakpoints:

**Phone (360 × 740):**
- `/` shows three cards.
- `/povesti` shows the timeline; story 1 visible & pulsing; locked stories grayed.
- Open story 1: canvas fullscreen, "Povestea" pill top-left opens the drawer; tapping a stamp/color/size does the right thing.
- Tap "Gata!" inside the drawer; lands on `/povesti?completed=creatie`; story 2 unlocks.

**Tablet/desktop (1024 × 768):**
- `/povesti/creatie` shows split layout — canvas on the left, story panel on the right, side rail toolbar inside the canvas.

- [ ] **Step 4: IndexedDB persistence walk**

In Chrome DevTools → Application → IndexedDB → `riza`:
- Draw a few strokes on a story; wait > 1 s; refresh and confirm the canvas restores.
- Tap "Gata!" on a story; in DevTools see `progress` store has `{status: 'done'}` for that id and the next id has `{status: 'available'}`.
- Right-click the database → Delete; reload `/povesti` → only story 1 is available again.

- [ ] **Step 5: Real-device LAN test**

Per the previous spec's recipe:

```bash
HOSTNAME=0.0.0.0 pnpm dev
ipconfig getifaddr en0
```

On a phone or iPad on the same Wi-Fi, open `http://<lan-ip>:3000`. Walk:
- Home → Povesti din Biblie → story 1 → draw → Povestea drawer → Gata!
- Verify drawing latency feels normal, drawer dismissal works with a downward swipe, no scroll/zoom interference while drawing.

- [ ] **Step 6: Final commit (only if any tweaks were made during step 5)**

```bash
git status
# If tweaks:
git commit -am "Real-device polish for bible-stories"
```
