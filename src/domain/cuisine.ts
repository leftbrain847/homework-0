// Keep in sync with data/schemas/cuisine.schema.json (a unit test enforces this).
export const CUISINES = [
  'american',
  'bakery_cafe',
  'bbq',
  'burgers',
  'italian',
  'mexican',
  'noodles',
  'salads',
] as const;

export type Cuisine = (typeof CUISINES)[number];

const LABELS: Record<Cuisine, string> = {
  american: 'American',
  bakery_cafe: 'Bakery & café',
  bbq: 'Barbecue',
  burgers: 'Burgers',
  italian: 'Italian',
  mexican: 'Mexican',
  noodles: 'Noodles',
  salads: 'Salads',
};

export function cuisineLabel(cuisine: Cuisine): string {
  return LABELS[cuisine];
}
