function hashString(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; ++i) {
    hash = Math.imul(31, hash) + value.charCodeAt(i);
    hash |= 0;
  }

  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  return function (): number {
    let value = seed += 0x6D2B79F5;

    value = Math.imul(
      value ^ value >>> 15,
      value | 1,
    );

    value ^= value + Math.imul(
      value ^ value >>> 7,
      value | 61,
    );

    return ((value ^ value >>> 14) >>> 0 ) / 4294967296;
  };
}

export function getAvatarBackgroundColor(value: string): string {
  const random = mulberry32(hashString(value));

  const hue = Math.floor(random() * 360);

  return `hsl(${hue} 55% 42%)`;
}

export function getAvatarText(name: string): string {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return 'U';
  }

  return trimmedName
    .slice(0, 2)
    .toUpperCase();
}