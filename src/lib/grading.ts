export type GradeBand = { grade: string; min: number; max: number; points: number };
export type DivisionBand = { division: string; min: number; max: number };

export const NECTA_SCALE: GradeBand[] = [
  { grade: "A", min: 75, max: 100, points: 1 },
  { grade: "B", min: 65, max: 74, points: 2 },
  { grade: "C", min: 45, max: 64, points: 3 },
  { grade: "D", min: 30, max: 44, points: 4 },
  { grade: "F", min: 0, max: 29, points: 5 },
];

export const NECTA_DIVISIONS: DivisionBand[] = [
  { division: "I", min: 7, max: 17 },
  { division: "II", min: 18, max: 21 },
  { division: "III", min: 22, max: 25 },
  { division: "IV", min: 26, max: 33 },
  { division: "0", min: 34, max: 35 },
];

export function gradeFor(score: number, scale: GradeBand[] = NECTA_SCALE): GradeBand {
  return scale.find((b) => score >= b.min && score <= b.max) ?? scale[scale.length - 1];
}

export function divisionFor(points: number, divs: DivisionBand[] = NECTA_DIVISIONS): string {
  return (divs.find((d) => points >= d.min && points <= d.max) ?? divs[divs.length - 1]).division;
}

export function computeDivision(scores: number[], scale = NECTA_SCALE, divs = NECTA_DIVISIONS) {
  const points = scores.map((s) => gradeFor(s, scale).points).sort((a, b) => a - b);
  const best7 = points.slice(0, 7);
  const total = best7.reduce((a, b) => a + b, 0);
  return { points: total, division: divisionFor(total, divs) };
}
