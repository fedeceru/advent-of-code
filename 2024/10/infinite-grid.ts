import Heap from 'heap';

export type GridId = `${number},${number}`;
export type Coord = [number, number];
export type CoordObj = { x: number; y: number };

export type CardinalDirections = 'N' | 'S' | 'E' | 'W';
export type CardinalDirectionsWithDiagonals = CardinalDirections | 'NW' | 'NE' | 'SW' | 'SE';

/**
 * @typedef {String} GridId - Two numbers separated by a comma.
 * @example "10,5"
 */

/**
 * @typedef {Object} InfiniteGridConstructorOptions
 * @property {?Function<x, y>} defaultFactory - Defaults to returning 0 for new coords
 * @property {?Object} string_map - Map grid values to strings.
 * @property {?String|any[][]} load - Initial grid to load. Can be a "2D" string (string with new lines), or a "2D" array.
 * @property {?Function<v>} parseAs - When `load` is defined, this parses the cell in the split string. Defaults to `String`.
 */

type DefaultFactory<TValidValues> = (x: number, y: number) => TValidValues;
type StringMap<TValidValues> = Partial<Record<TValidValues, string>>;
type ParseAs<TValidValues> = (str: string) => TValidValues;

type Array2D<T> = Array<Array<T>>;

interface InfiniteGridConstructorOptions<TValidValues> {
	defaultFactory?: DefaultFactory<TValidValues>;
	string_map?: StringMap<TValidValues>;
	load?: string;
	parseAs?: ParseAs<TValidValues>;
}

export class InfiniteGrid<TValidValues = unknown> {
	defaultFactory: (x: number, y: number) => TValidValues;
	string_map: StringMap<TValidValues>;
	grid: Map<GridId, TValidValues>;

	max_x: number;
	min_x: number;
	max_y: number;
	min_y: number;

	/**
	 * @param {InfiniteGridConstructorOptions} options
	 */
	constructor({
		defaultFactory = (x, y) => 0,
		string_map = {},
		load: loadStr,
		parseAs,
	}: InfiniteGridConstructorOptions<TValidValues> = {}) {
		this.defaultFactory = defaultFactory.bind(this);
		this.string_map = string_map;
		this.grid = new Map();
		this.max_x = -Infinity;
		this.min_x = Infinity;
		this.max_y = -Infinity;
		this.min_y = Infinity;

		if (loadStr) {
			this.load(loadStr, parseAs);
		}
	}

	/**
	 * @param {Number} x
	 * @param {Number} y
	 * @returns {GridId}
	 */
	static toId(x: number, y: number): GridId {
		return `${x},${y}`;
	}

	/**
	 * @param {GridId} id
	 * @param {Boolean} [return_as_object=false]
	 * @returns {{x: Number, y: Number} | [Number, Number]}
	 */
	static toCoords(id: GridId, return_as_object?: false): Coord;
	static toCoords(id: GridId, return_as_object: true): CoordObj;
	static toCoords(id: GridId, return_as_object?: boolean): Coord | CoordObj;
	static toCoords(id: GridId, return_as_object?: boolean) {
		let [_x, _y] = id.split(',');
		let x = parseInt(_x, 10);
		let y = parseInt(_y, 10);
		return return_as_object ? { x, y } : [x, y];
	}

	/**
	 * @param {GridId} id
	 * @returns {number}
	 */
	static toXCoord(id: GridId): number {
		let comma = id.indexOf(',');
		return parseInt(id.slice(0, comma), 10);
	}

	/**
	 * @param {GridId} id
	 * @returns {number}
	 */
	static toYCoord(id: GridId): number {
		let comma = id.indexOf(',');
		return parseInt(id.slice(comma + 1), 10);
	}

	/**
	 * @param {String} two_dimensional_string
	 * @returns {any[][]}
	 */
	static split(two_dimensional_string: string): Array2D<string> {
		return two_dimensional_string.split('\n').map((row) => row.split(''));
	}

	static moveInDirection(
		x: number,
		y: number,
		direction: CardinalDirectionsWithDiagonals
	): [number, number] {
		switch (direction) {
			case 'N':
				return [x, y - 1];
			case 'W':
				return [x - 1, y];
			case 'E':
				return [x + 1, y];
			case 'S':
				return [x, y + 1];
			case 'NW':
				return [x - 1, y - 1];
			case 'NE':
				return [x + 1, y - 1];
			case 'SW':
				return [x - 1, y + 1];
			case 'SE':
				return [x + 1, y + 1];
			default:
				throw new Error(
					'Invalid direction for moveInDirection. Valid directions are N, W, E, S, NW, NE, SW, SE'
				);
		}
	}

	reset() {
		this.grid = new Map();
		this.max_x = -Infinity;
		this.min_x = Infinity;
		this.max_y = -Infinity;
		this.min_y = Infinity;
		return this;
	}

	/**
	 * @param {String|any[][]} input
	 */
	load(
		input: string | Array2D<string>,
		parseAs: ParseAs<TValidValues> = String as unknown as ParseAs<TValidValues>
	): void {
		this.reset();
		let grid = input;
		if (typeof input === 'string') {
			grid = InfiniteGrid.split(input);
		}

		for (let y = 0; y < grid.length; y++) {
			for (let x = 0; x < grid[y].length; x++) {
				this.set(x, y, parseAs(grid[y][x]));
			}
		}
	}

	getRow(x: number, y: number, include_self = false) {
		const self_id = InfiniteGrid.toId(x, y);
		let cell_ids = Array(Math.abs(this.max_x - this.min_x) + 1)
			.fill(undefined)
			.map((_, i) => InfiniteGrid.toId(this.min_x + i, y));

		if (!include_self) {
			cell_ids = cell_ids.filter((id) => id !== self_id);
		}

		return cell_ids.map((id) => this.grid.get(id));
	}

	getCol(x: number, y: number, include_self = false) {
		const self_id = InfiniteGrid.toId(x, y);
		let cell_ids = Array(Math.abs(this.max_y - this.min_y) + 1)
			.fill(undefined)
			.map((_, i) => InfiniteGrid.toId(x, this.min_y + i));

		if (!include_self) {
			cell_ids = cell_ids.filter((id) => id !== self_id);
		}

		return cell_ids.map((id) => this.grid.get(id));
	}

	/**
	 * @todo The "wrap around" only really makes sense in a rectangular grid.
	 * Try to code in the cases where we have some cols/rows that are larger than others.
	 * @returns {[any, [number, number]]}
	 */
	getNeighbor(
		x: number,
		y: number,
		direction: CardinalDirectionsWithDiagonals,
		{ wrap_around = false } = {}
	): undefined | [TValidValues, Coord] {
		if (!this.inBounds(x, y)) {
			return;
		}

		const coord = InfiniteGrid.moveInDirection(x, y, direction);
		const [new_x, new_y] = coord;

		if (this.inBounds(new_x, new_y)) {
			return [this.get(new_x, new_y), coord];
		} else if (wrap_around) {
			if (this.inBounds(new_x) && !this.inBounds(undefined, new_y)) {
				if (direction === 'N') {
					// Wrap to bottom
					return [this.get(new_x, this.max_y), [new_x, this.max_y]];
				} else {
					// Wrap to top
					return [this.get(new_x, this.min_y), [new_x, this.min_y]];
				}
			} else if (!this.inBounds(new_x) && this.inBounds(undefined, new_y)) {
				if (direction === 'E') {
					// Wrap to left
					return [this.get(this.min_x, new_y), [this.min_x, new_y]];
				} else {
					// Wrap to right
					return [this.get(this.max_x, new_y), [this.max_x, new_y]];
				}
			}
		}
	}

	/**
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Boolean} [diagonals=false]
	 * @returns {Map} Return a map with optional keys N, W, E, S (and NW, NE, SW, SE if `diagonals` is true) if those neighbors are within the bounds of the map.
	 */
	neighbors(
		x: number,
		y: number,
		diagonals = false
	): Map<CardinalDirectionsWithDiagonals, { id: GridId; coord: Coord; value: TValidValues }> {
		const neighboring_cells: Map<
			CardinalDirectionsWithDiagonals,
			{ id: GridId; coord: Coord; value: TValidValues }
		> = new Map();
		if (!this.inBounds(x, y)) {
			return neighboring_cells;
		}

		const neighbors_lookup: Array<[CardinalDirectionsWithDiagonals, Coord]> = [
			['N', [x, y - 1]],
			['W', [x - 1, y]],
			['E', [x + 1, y]],
			['S', [x, y + 1]],
		];

		if (diagonals) {
			neighbors_lookup.push(
				['NW', [x - 1, y - 1]],
				['NE', [x + 1, y - 1]],
				['SW', [x - 1, y + 1]],
				['SE', [x + 1, y + 1]]
			);
		}

		for (let [key, coord] of neighbors_lookup) {
			let [cx, cy] = coord;
			if (this.inBounds(cx, cy)) {
				neighboring_cells.set(key, {
					id: InfiniteGrid.toId(cx, cy),
					coord,
					value: this.get(cx, cy),
				});
			}
		}

		return neighboring_cells;
	}

	/**
	 * @param {Number} x
	 * @param {Number} y
	 * @param {any} value
	 */
	set(x: number, y: number, value: TValidValues): void {
		if (typeof x !== 'number' || typeof y !== 'number') {
			throw new Error(`x and y must be numbers, got (${typeof x})${x} and (${typeof y})${y}`);
		}
		if (x < this.min_x) this.min_x = x;
		if (x > this.max_x) this.max_x = x;
		if (y < this.min_y) this.min_y = y;
		if (y > this.max_y) this.max_y = y;
		const id = InfiniteGrid.toId(x, y);
		this.grid.set(id, value);
	}

	/**
	 * @param {[number, number]} aCoords
	 * @param {[number, number]} bCoords
	 */
	swap([ax, ay]: Coord, [bx, by]: Coord) {
		const tempA = this.get(ax, ay);
		this.set(ax, ay, this.get(bx, by));
		this.set(bx, by, tempA);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {'N' | 'W' | 'E' | 'S' | 'NW' | 'NE' | 'SW' | 'SE'} direction
	 * @returns {[number, number]} Returns the new coords the cell is now at
	 */
	moveViaSwap(x: number, y: number, direction: CardinalDirectionsWithDiagonals) {
		const newCoord = InfiniteGrid.moveInDirection(x, y, direction);
		this.swap([x, y], newCoord);

		return newCoord;
	}

	/**
	 * @param {Number} x
	 * @param {Number} y
	 * @returns {any}
	 */
	get(x: number, y: number): TValidValues {
		const id = InfiniteGrid.toId(x, y);
		if (!this.grid.has(id)) {
			this.set(x, y, this.defaultFactory(x, y));
		}
		return this.grid.get(id)!;
	}

	/**
	 * @param {RegExp|any} value
	 * @returns {Array<{value: any, id: GridId, coords: [number, number]}>} - Returns an Array, the first value matching the cell found, and the 2nd the coords or ID.
	 */
	findAll(value: TValidValues | RegExp) {
		const found = [];
		for (let [id, cell] of this.grid) {
			const check = value instanceof RegExp ? value.test(cell as string) : value === cell;
			if (check) {
				found.push({ value: cell, id, coords: InfiniteGrid.toCoords(id) });
			}
		}

		return found;
	}

	inBounds(x: number, y: number): boolean;
	inBounds(x: number | undefined, y: number): boolean;
	inBounds(x: number, y?: number): boolean;
	inBounds(x?: number, y?: number): boolean;
	inBounds(x?: number, y?: number): boolean {
		if (x !== undefined && y !== undefined) {
			return x >= this.min_x && x <= this.max_x && y >= this.min_y && y <= this.max_y;
		} else if (x !== undefined && y === undefined) {
			return x >= this.min_x && x <= this.max_x;
		} else if (x === undefined && y !== undefined) {
			return y >= this.min_y && y <= this.max_y;
		}

		return false;
	}

	clone({ empty = false } = {}) {
		const infinite_grid_clone = new InfiniteGrid();
		const new_map = new Map();
		if (!empty) {
			for (let [key, val] of this.grid) {
				new_map.set(key, typeof val === 'object' ? JSON.parse(JSON.stringify(val)) : val);
			}
		}
		infinite_grid_clone.defaultFactory = this.defaultFactory.bind(this);
		infinite_grid_clone.string_map = JSON.parse(JSON.stringify(this.string_map));
		infinite_grid_clone.grid = new_map;
		infinite_grid_clone.max_x = this.max_x;
		infinite_grid_clone.min_x = this.min_x;
		infinite_grid_clone.max_y = this.max_y;
		infinite_grid_clone.min_y = this.min_y;

		return infinite_grid_clone;
	}

	sum() {
		let sum = 0;
		for (let value of this.grid.values()) {
			sum += value as number;
		}

		return sum;
	}

	resize() {
		this.max_x = -Infinity;
		this.min_x = Infinity;
		this.max_y = -Infinity;
		this.min_y = Infinity;

		for (let id of this.grid.keys()) {
			let [x, y] = InfiniteGrid.toCoords(id);
			if (x < this.min_x) this.min_x = x;
			if (x > this.max_x) this.max_x = x;
			if (y < this.min_y) this.min_y = y;
			if (y > this.max_y) this.max_y = y;
		}
	}

	buildDijkstrasFrontier(from_x: number, from_y: number) {
		const from_id = InfiniteGrid.toId(from_x, from_y);

		// Sort our frontier by its priority, so we pick nodes to visit that have the lowest cost.
		const frontier = new Heap((node_a, node_b) => node_a.priority - node_b.priority);
		frontier.push({ id: from_id, priority: 0 });

		const came_from = new Map([[from_id, null]]);
		const cost_so_far = new Map([[from_id, 0]]);
		while (!frontier.empty()) {
			const current = frontier.pop();

			const [current_x, current_y] = InfiniteGrid.toCoords(current.id);

			for (let next of this.neighbors(current_x, current_y).values()) {
				const new_cost = cost_so_far.get(current.id) + next.value;
				if (!cost_so_far.has(next.id) || new_cost < cost_so_far.get(next.id)) {
					cost_so_far.set(next.id, new_cost);
					frontier.push({ id: next.id, priority: new_cost });
					came_from.set(next.id, current.id);
				}
			}
		}

		return came_from;
	}

	getShortestWeightedPath(from_x, from_y, to_x, to_y, { include_from = true } = {}) {
		const from_id = InfiniteGrid.toId(from_x, from_y);
		const to_id = InfiniteGrid.toId(to_x, to_y);
		const came_from = this.buildDijkstrasFrontier(from_x, from_y);
		let current = to_id;

		let path = [];
		while (current !== from_id) {
			path.push(current);
			current = came_from.get(current);
		}

		if (include_from) {
			path.push(from_id);
		}
		path.reverse();
		return path;
	}

	toGrid() {
		let grid = [];
		for (let y = this.min_y; y <= this.max_y; y++) {
			let row = [];
			for (let x = this.min_x; x <= this.max_x; x++) {
				let cell = this.get(x, y);
				row.push(cell);
			}
			grid.push(row);
		}

		return grid;
	}

	toJSON() {
		return this.toGrid();
	}

	toString() {
		let grid = this.toGrid();
		let rows = '';
		for (let y = 0; y < grid.length; y++) {
			let row = '';
			for (let x = 0; x < grid[y].length; x++) {
				let cell = grid[y][x];
				let cell_string = cell in this.string_map ? this.string_map[cell] : String(cell);
				row += cell_string;
			}
			rows += rows.length ? '\n' + row : row;
		}

		return rows;
	}

	*[Symbol.iterator]() {
		yield* this.grid.entries();
	}

	entries() {
		return this.grid.entries();
	}

	values() {
		return this.grid.values();
	}

	keys() {
		return this.grid.keys();
	}
}
