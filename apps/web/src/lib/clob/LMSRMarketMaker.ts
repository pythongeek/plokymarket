
export class LMSRMarketMaker {
    private alpha: number; // Liquidity parameter (b in standard literature)

    constructor(alpha: number = 100) {
        this.alpha = alpha;
    }

    /**
     * Calculates the cost function C(q)
     * C(q) = b * ln(sum(exp(q_i / b)))
     */
    private costFunction(quantities: number[]): number {
        const sumExp = quantities.reduce((sum, q) => sum + Math.exp(q / this.alpha), 0);
        return this.alpha * Math.log(sumExp);
    }

    /**
     * Calculates the price for a specific outcome given current quantities.
     * P_i = exp(q_i / b) / sum(exp(q_j / b))
     */
    getPrice(outcomeIndex: number, quantities: number[]): number {
        if (outcomeIndex < 0 || outcomeIndex >= quantities.length) {
            throw new Error('Invalid outcome index');
        }

        const expQ = quantities.map(q => Math.exp(q / this.alpha));
        const sumExp = expQ.reduce((sum, val) => sum + val, 0);

        return expQ[outcomeIndex] / sumExp;
    }

    /**
     * Calculates the cost to buy a specific amount of shares for an outcome.
     * Cost = C(q_new) - C(q_old)
     */
    getCostToBuy(outcomeIndex: number, amount: number, currentQuantities: number[]): number {
        const newQuantities = [...currentQuantities];
        newQuantities[outcomeIndex] += amount;

        const costOld = this.costFunction(currentQuantities);
        const costNew = this.costFunction(newQuantities);

        return costNew - costOld;
    }
}
