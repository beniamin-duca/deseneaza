// Centralized template configuration for easy admin management
// This can later be connected to a CMS or admin dashboard

export type TemplateCategory = 'animals' | 'vehicles' | 'nature' | 'fantasy'
export type TemplateDifficulty = 'easy' | 'medium' | 'hard'

export interface Template {
  id: string
  name: string
  nameRo: string // Romanian name
  src: string
  category: TemplateCategory
  difficulty: TemplateDifficulty
  order: number
}

export interface Stamp {
  id: string
  name: string
  src: string
  category: string
}

// Color palette for the drawing tools - kid-friendly bright colors
export const DRAWING_COLORS = [
  { id: 'red', value: '#FF6B6B', name: 'Rosu' },
  { id: 'coral', value: '#FF8A65', name: 'Coral' },
  { id: 'orange', value: '#FFB74D', name: 'Portocaliu' },
  { id: 'yellow', value: '#FFE66D', name: 'Galben' },
  { id: 'lime', value: '#AED581', name: 'Verde deschis' },
  { id: 'green', value: '#4ECDC4', name: 'Verde' },
  { id: 'teal', value: '#26A69A', name: 'Turcoaz' },
  { id: 'blue', value: '#64B5F6', name: 'Albastru' },
  { id: 'indigo', value: '#7986CB', name: 'Indigo' },
  { id: 'purple', value: '#BA68C8', name: 'Mov' },
  { id: 'pink', value: '#F06292', name: 'Roz' },
  { id: 'brown', value: '#A1887F', name: 'Maro' },
  { id: 'black', value: '#424242', name: 'Negru' },
  { id: 'white', value: '#FFFFFF', name: 'Alb' },
] as const

// Brush sizes with kid-friendly names
export const BRUSH_SIZES = [
  { id: 'small', value: 8, name: 'Mic', icon: '●' },
  { id: 'medium', value: 16, name: 'Mediu', icon: '●' },
  { id: 'large', value: 28, name: 'Mare', icon: '●' },
  { id: 'xlarge', value: 44, name: 'Foarte mare', icon: '●' },
] as const

// Templates organized by category and difficulty
export const TEMPLATES: Template[] = [
  // Animals - Easy
  { id: 'cat', name: 'Cat', nameRo: 'Pisica', src: '/templates/cat.jpg', category: 'animals', difficulty: 'easy', order: 1 },
  { id: 'dog', name: 'Dog', nameRo: 'Catel', src: '/templates/dog.jpg', category: 'animals', difficulty: 'easy', order: 2 },
  { id: 'bunny', name: 'Bunny', nameRo: 'Iepuras', src: '/templates/bunny.jpg', category: 'animals', difficulty: 'easy', order: 3 },
  { id: 'fish', name: 'Fish', nameRo: 'Pestisor', src: '/templates/fish.jpg', category: 'animals', difficulty: 'easy', order: 4 },
  
  // Animals - Medium
  { id: 'lion', name: 'Lion', nameRo: 'Leu', src: '/templates/lion.jpg', category: 'animals', difficulty: 'medium', order: 5 },
  { id: 'bird', name: 'Bird', nameRo: 'Pasare', src: '/templates/bird.jpg', category: 'animals', difficulty: 'medium', order: 6 },
  
  // Vehicles - Easy
  { id: 'car', name: 'Car', nameRo: 'Masina', src: '/templates/car.jpg', category: 'vehicles', difficulty: 'easy', order: 7 },
  
  // Vehicles - Medium
  { id: 'plane', name: 'Airplane', nameRo: 'Avion', src: '/templates/plane.jpg', category: 'vehicles', difficulty: 'medium', order: 8 },
  { id: 'rocket', name: 'Rocket', nameRo: 'Racheta', src: '/templates/rocket.jpg', category: 'vehicles', difficulty: 'medium', order: 9 },
  
  // Nature - Easy
  { id: 'sun', name: 'Sun', nameRo: 'Soare', src: '/templates/sun.jpg', category: 'nature', difficulty: 'easy', order: 10 },
  { id: 'flower', name: 'Flower', nameRo: 'Floare', src: '/templates/flower.jpg', category: 'nature', difficulty: 'easy', order: 11 },
  { id: 'tree', name: 'Tree', nameRo: 'Copac', src: '/templates/tree.jpg', category: 'nature', difficulty: 'medium', order: 12 },
  
  // Fantasy - Medium/Hard
  { id: 'unicorn', name: 'Unicorn', nameRo: 'Unicorn', src: '/templates/unicorn.jpg', category: 'fantasy', difficulty: 'medium', order: 13 },
  { id: 'dinosaur', name: 'Dinosaur', nameRo: 'Dinozaur', src: '/templates/dinosaur.jpg', category: 'fantasy', difficulty: 'hard', order: 14 },
]

// Stamps for stamp mode
export const STAMPS: Stamp[] = [
  { id: 'star', name: 'Stea', src: '/stamps/star.jpg', category: 'shapes' },
  { id: 'heart', name: 'Inima', src: '/stamps/heart.jpg', category: 'shapes' },
  { id: 'rainbow', name: 'Curcubeu', src: '/stamps/rainbow.jpg', category: 'nature' },
  { id: 'butterfly', name: 'Fluture', src: '/stamps/butterfly.jpg', category: 'nature' },
  { id: 'cloud', name: 'Nor', src: '/stamps/cloud.jpg', category: 'nature' },
  { id: 'moon', name: 'Luna', src: '/stamps/moon.jpg', category: 'nature' },
  { id: 'flower', name: 'Floare', src: '/stamps/flower.jpg', category: 'nature' },
  { id: 'fish', name: 'Peste', src: '/stamps/fish.jpg', category: 'animals' },
  { id: 'bird', name: 'Pasare', src: '/stamps/bird.jpg', category: 'animals' },
  { id: 'paw', name: 'Labuta', src: '/stamps/paw.jpg', category: 'animals' },
  { id: 'apple', name: 'Mar', src: '/stamps/apple.jpg', category: 'food' },
  { id: 'cake', name: 'Tort', src: '/stamps/cake.jpg', category: 'food' },
  { id: 'house', name: 'Casa', src: '/stamps/house.jpg', category: 'objects' },
  { id: 'balloon', name: 'Balon', src: '/stamps/balloon.jpg', category: 'objects' },
  { id: 'crown', name: 'Coroana', src: '/stamps/crown.jpg', category: 'objects' },
  { id: 'sparkle', name: 'Sclipici', src: '/stamps/sparkle.jpg', category: 'effects' },
]

// Helper functions
export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return TEMPLATES.filter(t => t.category === category).sort((a, b) => a.order - b.order)
}

export function getTemplatesByDifficulty(difficulty: TemplateDifficulty): Template[] {
  return TEMPLATES.filter(t => t.difficulty === difficulty).sort((a, b) => a.order - b.order)
}

export function getEasyTemplates(): Template[] {
  return getTemplatesByDifficulty('easy')
}

export function getAllTemplatesSorted(): Template[] {
  // Sort by difficulty (easy first) then by order
  const difficultyOrder = { easy: 0, medium: 1, hard: 2 }
  return [...TEMPLATES].sort((a, b) => {
    const diffDiff = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
    if (diffDiff !== 0) return diffDiff
    return a.order - b.order
  })
}

export function getRandomTemplate(): Template {
  return TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id)
}

// Category labels in Romanian
export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  animals: 'Animale',
  vehicles: 'Vehicule',
  nature: 'Natura',
  fantasy: 'Fantezie',
}

// Difficulty labels in Romanian with visual indicator
export const DIFFICULTY_LABELS: Record<TemplateDifficulty, { label: string; stars: number }> = {
  easy: { label: 'Usor', stars: 1 },
  medium: { label: 'Mediu', stars: 2 },
  hard: { label: 'Greu', stars: 3 },
}
