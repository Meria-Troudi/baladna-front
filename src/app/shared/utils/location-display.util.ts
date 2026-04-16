const ROUTE_SEPARATOR_REGEX = /\s(?:->|to)\s/i;
const ADMINISTRATIVE_TERMS = [
  'tunisie',
  'tunisia',
  'gouvernorat',
  'governorate',
  'delegation',
  'ville',
  'city'
];

function normalizeWhitespace(value?: string | null): string {
  return (value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeComparable(value: string): string {
  return normalizeWhitespace(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAdministrativePart(value: string): boolean {
  const comparable = normalizeComparable(value);
  if (!comparable) {
    return true;
  }

  if (/^\d+$/.test(comparable)) {
    return true;
  }

  return ADMINISTRATIVE_TERMS.some((term) => comparable === term || comparable.startsWith(`${term} `));
}

export function getCompactLocationText(value?: string | null): string {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return '';
  }

  const parts = normalized
    .split(',')
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean);

  if (!parts.length) {
    return normalized;
  }

  return parts.find((part) => !isAdministrativePart(part)) || parts[0];
}

export function getCompactPlaceTitle(name?: string | null, city?: string | null): string {
  return getCompactLocationText(name) || getCompactLocationText(city) || 'N/A';
}

export function getCompactPlaceLabel(name?: string | null, city?: string | null): string {
  const compactName = getCompactPlaceTitle(name, city);
  const compactCity = getCompactLocationText(city);

  if (!compactCity) {
    return compactName;
  }

  const comparableName = normalizeComparable(compactName);
  const comparableCity = normalizeComparable(compactCity);

  if (
    !comparableName ||
    comparableName === comparableCity ||
    comparableName.includes(comparableCity) ||
    comparableCity.includes(comparableName)
  ) {
    return compactName;
  }

  return `${compactName} - ${compactCity}`;
}

export function getCompactRouteText(value?: string | null): string {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return 'N/A';
  }

  const parts = normalized.split(ROUTE_SEPARATOR_REGEX).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) {
    return getCompactLocationText(normalized) || normalized;
  }

  return `${getCompactLocationText(parts[0])} -> ${getCompactLocationText(parts[1])}`;
}

export function getCompactRouteLabel(
  departureName?: string | null,
  departureCity?: string | null,
  arrivalName?: string | null,
  arrivalCity?: string | null
): string {
  return `${getCompactPlaceTitle(departureName, departureCity)} -> ${getCompactPlaceTitle(arrivalName, arrivalCity)}`;
}
