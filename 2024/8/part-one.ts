import G from 'generatorics';
import _ from 'lodash';

import { input } from './input';

type Point = {
	x: number;
	y: number;
	char: string;
};

const points: Array<Point> = input
	.map((line, y) => {
		return line.map((char, x) => {
			return {
				char,
				x,
				y,
			};
		});
	})
	.flat();

const maxX = input[0].length;
const maxY = input.length;

function inBounds(x: number, y: number): boolean {
	return x >= 0 && x < maxX && y >= 0 && y < maxY;
}

function shift(vecA: readonly [number, number], vecB: readonly [number, number]): [number, number] {
	return [vecA[0] + vecB[0], vecA[1] + vecB[1]];
}

const antinodeCache = new Map<string, Point>();
function getAntinode(x: number, y: number, char: string): Point {
	const key = `${x},${y},${char}`;
	if (!antinodeCache.has(key)) {
		antinodeCache.set(key, { x, y, char });
	}
	return antinodeCache.get(key)!;
}

const antennas = points.filter((point) => point.char !== '.');
const groups = new Map<string, Array<[number, number]>>();
for (let antenna of antennas) {
	if (!groups.has(antenna.char)) {
		groups.set(antenna.char, []);
	}
	groups.get(antenna.char)!.push([antenna.x, antenna.y]);
}

const uniqueAntennas = Array.from(groups.keys());

const antinodes = new Set<Point>();

for (let antennaType of uniqueAntennas) {
	const coords = groups.get(antennaType)!;
	if (coords.length < 2) {
		continue;
	}

	for (let antennaPair of G.combination(coords, 2)) {
		const [coordA, coordB] = antennaPair;
		const aToB = [coordB[0] - coordA[0], coordB[1] - coordA[1]] as const;
		const bToA = [coordA[0] - coordB[0], coordA[1] - coordB[1]] as const;

		const antinodeA = shift(coordA, bToA);
		if (inBounds(...antinodeA)) {
			antinodes.add(getAntinode(...antinodeA, antennaType));
		}

		const antinodeB = shift(coordB, aToB);
		if (inBounds(...antinodeB)) {
			antinodes.add(getAntinode(...antinodeB, antennaType));
		}
	}
}

const uniqueAntinodes = _.uniqBy(Array.from(antinodes), (point) => `${point.x},${point.y}`);

console.log(uniqueAntinodes.length);
