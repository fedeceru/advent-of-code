class Formula {
	constructor(recipes) {
		this.recipes = recipes;
	}

	calculateOreTo(element, amount = 1) {
		// Initialize leftovers to be 0 (including ORE)
		this.leftover = Object.keys(this.recipes).reduce(
			(obj, element) => ((obj[element] = 0), obj),
			{ ORE: 0 }
		);
		let ore = this.recursiveCalculateOreTo(element, amount);

		return {
			ore,
			leftover: this.leftover,
		};
	}

	recursiveCalculateOreTo(element, amount = 1) {
		if (element === 'ORE') {
			return amount;
		}

		let { creates, needs } = this.recipes[element];
		let amount_minus_leftover = amount - this.leftover[element];
		let need_to_create = Math.max(amount_minus_leftover, 0);
		let multiplier = Math.ceil(need_to_create / creates);
		let leftover_after_synthesis = creates * multiplier - amount_minus_leftover;
		this.leftover[element] = leftover_after_synthesis;

		if (need_to_create === 0) {
			/**
			 * We already have enough of this element created, we don't need to synthesize more.
			 * So, it doesn't cost us any ORE, return 0 to indicate that.
			 */
			return 0;
		}

		// Otherwise, we need to synthesize this element
		let ore_sum = 0;
		for (let [piece_element, piece_amount] of needs) {
			ore_sum += this.recursiveCalculateOreTo(piece_element, multiplier * piece_amount);
		}

		return ore_sum;
	}
}

module.exports = Formula;
