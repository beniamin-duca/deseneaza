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
