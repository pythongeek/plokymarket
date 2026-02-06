/**
 * Monotonic Cubic Interpolation (Fritsch-Butland)
 * Ensures that the interpolated curve stays monotonic if the input data is monotonic.
 * Crucial for cumulative volume charts where volume must never decrease.
 */

export interface Point {
    x: number;
    y: number;
}

export function computeMonotonicCubic(points: Point[]): (x: number) => number {
    if (points.length < 2) return (x: number) => points.length === 1 ? points[0].y : 0;

    const n = points.length;
    const dx = new Array(n - 1);
    const dy = new Array(n - 1);
    const ms = new Array(n - 1);

    for (let i = 0; i < n - 1; i++) {
        dx[i] = points[i + 1].x - points[i].x;
        dy[i] = points[i + 1].y - points[i].y;
        ms[i] = dy[i] / dx[i];
    }

    // Tangents at each point
    const c = new Array(n);
    c[0] = ms[0];
    for (let i = 1; i < n - 1; i++) {
        if (ms[i - 1] * ms[i] <= 0) {
            c[i] = 0;
        } else {
            const common = dx[i - 1] + dx[i];
            c[i] = (3 * common) / ((common + dx[i]) / ms[i - 1] + (common + dx[i - 1]) / ms[i]);
        }
    }
    c[n - 1] = ms[n - 2];

    return (x: number) => {
        // Find interval
        let i = 0;
        while (i < n - 2 && x > points[i + 1].x) i++;

        const h = points[i + 1].x - points[i].x;
        const t = (x - points[i].x) / h;
        const t2 = t * t;
        const t3 = t2 * t;

        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;

        return h00 * points[i].y + h10 * h * c[i] + h01 * points[i + 1].y + h11 * h * c[i + 1];
    };
}

/**
 * Resamples a sequence of points into a fixed number of samples using interpolation.
 */
export function resample(points: Point[], numSamples: number): number[] {
    if (points.length === 0) return new Array(numSamples).fill(0);
    const interp = computeMonotonicCubic(points);
    const samples = new Array(numSamples);
    const minX = points[0].x;
    const maxX = points[points.length - 1].x;
    const range = maxX - minX;

    for (let i = 0; i < numSamples; i++) {
        const x = minX + (range * i) / (numSamples - 1);
        samples[i] = interp(x);
    }
    return samples;
}
