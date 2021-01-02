function findEarliestBus(earliest_departure, bus_schedule) {
	let buses_in_service = bus_schedule.filter((bus) => bus !== 'x');
	let departure_time = earliest_departure;
	while (true) {
		for (let bus_in_service of buses_in_service) {
			const bus_has_arrived = departure_time % bus_in_service === 0;
			if (bus_has_arrived) {
				return {
					bus: bus_in_service,
					departure_time,
				};
			}
		}

		departure_time++;
	}
}

// @link https://rosettacode.org/wiki/Greatest_common_divisor#JavaScript
function gcd2(a, b) {
	a = Math.abs(a);
	b = Math.abs(b);

	if (b > a) {
		var temp = a;
		a = b;
		b = temp;
	}

	while (true) {
		a %= b;
		if (a === 0) {
			return b;
		}
		b %= a;
		if (b === 0) {
			return a;
		}
	}
}

function gcd(...nums) {
	let b = nums[0];

	for (let i = 1; i < nums.length; i++) {
		b = gcd2(nums[i], b);

		if (b === 1) {
			return 1;
		}
	}
	return b;
}
// @link https://github.com/nickleefly/node-lcm/blob/5d44997/index.js
const _lcm = (a, b) => {
	if (b === 0) return 0;
	return (a * b) / gcd2(a, b);
};

// @link https://stackoverflow.com/a/147523/864233
const lcm = (...args) => args.reduce((a, b) => _lcm(a, b));

/**
 * @returns {Object} - Return `{ gcd, x, y }` where `gcd` is the greater common divisor of params `a` and `b`, and `x` and `y` such that `x * a + y * b = gcd`
 */
function extgcd(a, b) {
	if (a < b) {
		let tmp = extgcd(b, a);
		return {
			gcd: tmp.gcd,
			x: tmp.y,
			y: tmp.x,
		};
	}

	if (b === 0) {
		return {
			gcd: a,
			x: 1,
			y: 0,
		};
	}

	let r = a % b;
	let tmp = extgcd(b, r);

	return {
		gcd: tmp.gcd,
		x: tmp.y,
		y: tmp.x - Math.floor(a / b) * tmp.y,
	};
}

module.exports = {
	findEarliestBus,
};
