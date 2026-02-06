import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { MarketDataLevel } from '@/lib/clob/types';
import { resample, Point } from '@/lib/clob/viz/gl-interp';

interface WebGLDepthChartProps {
    bids: MarketDataLevel[];
    asks: MarketDataLevel[];
    midPrice: number | null;
    zoomLevel: number; // 0.1 to 5.0
    granularity: number;
    wallThreshold?: number;
}

const VERTEX_SHADER = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_uv = (a_position + 1.0) / 2.0;
    }
`;

const FRAGMENT_SHADER = `
    precision highp float;
    varying vec2 v_uv;
    uniform float u_time;
    uniform vec3 u_bidColor;
    uniform vec3 u_askColor;
    uniform sampler2D u_data;
    uniform float u_isAsk;
    uniform float u_zoom;

    void main() {
        float h = texture2D(u_data, vec2(v_uv.x, 0.5)).r;
        
        // Base fill check
        if (v_uv.y > h) discard;

        vec3 color = mix(u_bidColor, u_askColor, u_isAsk);
        float depth = 1.0 - (v_uv.y / h);
        
        // Semantic coloring based on zoom
        if (u_zoom < 0.5) {
            // Histogram style: constant brightness
            color *= 0.8;
        } else {
            color *= (1.0 - depth * 0.4);
        }

        // Pulse for activity
        float pulse = sin(u_time * 8.0) * 0.015 * (1.0 - v_uv.y);
        color += pulse;

        gl_FragColor = vec4(color, 0.85);
    }
`;

export const WebGLDepthChart: React.FC<WebGLDepthChartProps> = ({
    bids,
    asks,
    midPrice,
    zoomLevel = 1.0,
    granularity = 1,
    wallThreshold = 1.5
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastUpdate = useRef<number>(0);
    const { theme } = useTheme();

    // Map Zoom Level to Range %
    const getRangePercent = (zoom: number) => {
        if (zoom <= 0.1) return 0.50;  // 50%
        if (zoom <= 0.5) return 0.10;  // 10%
        if (zoom <= 1.0) return 0.05;  // 5%
        if (zoom <= 2.0) return 0.02;  // 2%
        return 0.005;                  // 0.5% (5.0x)
    };

    const rangePct = getRangePercent(zoomLevel);
    const effectiveMid = midPrice || (bids[0]?.price + asks[0]?.price) / 2 || 0;
    const minPrice = effectiveMid * (1 - rangePct);
    const maxPrice = effectiveMid * (1 + rangePct);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !effectiveMid) return;

        const gl = canvas.getContext('webgl');
        if (!gl) return;

        // Compile Shaders
        const createShader = (type: number, source: string) => {
            const s = gl.createShader(type)!;
            gl.shaderSource(s, source);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(s));
            }
            return s;
        };

        const program = gl.createProgram()!;
        gl.attachShader(program, createShader(gl.VERTEX_SHADER, VERTEX_SHADER));
        gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
        gl.linkProgram(program);
        gl.useProgram(program);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const uTime = gl.getUniformLocation(program, 'u_time');
        const uBidColor = gl.getUniformLocation(program, 'u_bidColor');
        const uAskColor = gl.getUniformLocation(program, 'u_askColor');
        const uIsAsk = gl.getUniformLocation(program, 'u_isAsk');
        const uData = gl.getUniformLocation(program, 'u_data');
        const uZoom = gl.getUniformLocation(program, 'u_zoom');

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        let animationFrame: number;
        const render = (time: number) => {
            // Speed control based on zoom spec
            const frameTime = zoomLevel >= 5.0 ? 0 : (zoomLevel >= 2.0 ? 50 : (zoomLevel >= 1.0 ? 100 : (zoomLevel >= 0.5 ? 250 : 500)));
            if (time - lastUpdate.current < frameTime) {
                animationFrame = requestAnimationFrame(render);
                return;
            }
            lastUpdate.current = time;

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.uniform1f(uTime, time / 1000);
            gl.uniform1f(uZoom, zoomLevel);
            gl.uniform3f(uBidColor, 16 / 255, 185 / 255, 129 / 255);
            gl.uniform3f(uAskColor, 239 / 255, 68 / 255, 68 / 255);

            const filteredBids = bids.filter(b => b.price >= minPrice && b.price <= effectiveMid);
            const filteredAsks = asks.filter(a => a.price <= maxPrice && a.price >= effectiveMid);

            const maxVol = Math.max(
                filteredBids[filteredBids.length - 1]?.total || 1,
                filteredAsks[filteredAsks.length - 1]?.total || 1
            );

            // 1. Render Bids
            if (filteredBids.length > 0) {
                const bidPoints = filteredBids.map(b => ({ x: b.price, y: b.total }));
                // Ensure the point touches the mid price 
                bidPoints.push({ x: effectiveMid, y: 0 });
                const samples = resample(bidPoints, 256).map(v => v / maxVol);

                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array(samples.map(s => s * 255)));
                gl.uniform1f(uIsAsk, 0.0);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            }

            // 2. Render Asks
            if (filteredAsks.length > 0) {
                const askPoints = filteredAsks.map(a => ({ x: a.price, y: a.total }));
                askPoints.unshift({ x: effectiveMid, y: 0 });
                const samples = resample(askPoints, 256).map(v => v / maxVol);

                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array(samples.map(s => s * 255)));
                gl.uniform1f(uIsAsk, 1.0);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            }

            animationFrame = requestAnimationFrame(render);
        };

        animationFrame = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrame);
    }, [bids, asks, zoomLevel, minPrice, maxPrice, effectiveMid]);

    return (
        <div className="relative h-64 w-full bg-background p-4 rounded-lg border overflow-hidden">
            <div className="flex justify-between items-center mb-2 relative z-10">
                <h3 className="text-sm font-medium text-foreground">Market Depth (Semantic)</h3>
                <div className="text-[10px] text-muted-foreground flex gap-2">
                    <span>Range: ±{(rangePct * 100).toFixed(1)}%</span>
                    <span>Zoom: {zoomLevel.toFixed(1)}x</span>
                </div>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" width={1600} height={512} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};
