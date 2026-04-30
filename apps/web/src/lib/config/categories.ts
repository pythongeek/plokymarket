// lib/config/categories.ts
// Centralized category list — keep in sync with custom_categories table

export interface Category {
  name: string
  slug: string
  icon: string
  displayOrder: number
}

/** Built-in categories shipped with the app */
export const BUILT_IN_CATEGORIES: Category[] = [
  { name: 'Sports',               slug: 'sports',               icon: '🏏', displayOrder: 1  },
  { name: 'Cricket',              slug: 'cricket',              icon: '🏏', displayOrder: 2  },
  { name: 'Football',             slug: 'football',             icon: '⚽', displayOrder: 3  },
  { name: 'BPL',                  slug: 'bpl',                  icon: '🏏', displayOrder: 4  },
  { name: 'Politics',             slug: 'politics',             icon: '🗳️',  displayOrder: 5  },
  { name: 'Bangladesh Politics',  slug: 'bangladesh-politics',  icon: '🏛️', displayOrder: 6  },
  { name: 'Election',             slug: 'election',             icon: '🗳️',  displayOrder: 7  },
  { name: 'Economy',              slug: 'economy',              icon: '💰', displayOrder: 8  },
  { name: 'Stock Market',         slug: 'stock-market',         icon: '📈', displayOrder: 9  },
  { name: 'Crypto',               slug: 'crypto',               icon: '₿',  displayOrder: 10 },
  { name: 'Technology',           slug: 'technology',           icon: '💻', displayOrder: 11 },
  { name: 'Entertainment',        slug: 'entertainment',        icon: '🎬', displayOrder: 12 },
  { name: 'Bollywood',            slug: 'bollywood',            icon: '🎥', displayOrder: 13 },
  { name: 'Dhallywood',           slug: 'dhallywood',           icon: '🎞️',  displayOrder: 14 },
  { name: 'World Events',         slug: 'world-events',         icon: '🌍', displayOrder: 15 },
  { name: 'Science',              slug: 'science',              icon: '🔬', displayOrder: 16 },
  { name: 'Culture',              slug: 'culture',              icon: '🎭', displayOrder: 17 },
  { name: 'Business',             slug: 'business',             icon: '🏢', displayOrder: 18 },
  { name: 'Education',            slug: 'education',            icon: '📚', displayOrder: 19 },
  { name: 'Health',               slug: 'health',               icon: '🏥', displayOrder: 20 },
  { name: 'Environment',          slug: 'environment',          icon: '🌿', displayOrder: 21 },
  { name: 'Infrastructure',       slug: 'infrastructure',       icon: '🏗️',  displayOrder: 22 },
  { name: 'Dhaka City',           slug: 'dhaka-city',           icon: '🏙️',  displayOrder: 23 },
  { name: 'International',        slug: 'international',        icon: '🌐', displayOrder: 24 },
  { name: 'General',              slug: 'general',              icon: '📌', displayOrder: 25 },
]

/** For <select> elements — returns plain string list */
export const CATEGORY_NAMES = BUILT_IN_CATEGORIES.map(c => c.name)

/** Slug helper */
export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
