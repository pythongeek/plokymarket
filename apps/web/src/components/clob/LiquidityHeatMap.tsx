import React, { useEffect, useRef, useMemo } from 'react';
import { MarketDataLevel } from '@/lib/clob/types';

export enum HeatMapColorScale {
    Professional = 'professional', // Blue-orange diverging
    Traditional = 'traditional',   // Green-red
    Accessibility = 'accessibility', // Grayscale with patterns (simulated via grain/texture)
    HighContrast = 'highcontrast'   // Black-white
}

interface LiquidityHeatMapProps {
    bids: MarketDataLevel[];
    asks: MarketDataLevel[];
    colorScale?: HeatMapColorScale;
    isMobile?: boolean;
    windowMinutes?: number; // Default 5
}

export const LiquidityHeatMap: React.FC<LiquidityHeatMapProps> = ({
    bids,
    asks,
    colorScale = HeatMapColorScale.Professional,
    isMobile = false,
    windowMinutes = 5
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const textureRef = useRef<WebGLTexture | null>(null);
    const historyRef = useRef<Float32Array[]>([]); // Rolling window of depth slices
    const maxHistoryPoints = windowMinutes * 60; // Assuming 1Hz update
    const historicalMaxRef = useRef<number>(1.0);

    // Initial setup
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true });
        if (!gl) return;
        glRef.current = gl;

        // Shaders
        const vsSource = `
            attribute vec2 position;
            attribute vec2 texCoord;
            varying vec2 vTexCoord;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
                vTexCoord = texCoord;
            }
        `;

        const fsSource = `
            precision mediump float;
            varying vec2 vTexCoord;
            uniform sampler2 texture;
            uniform int colorScale;
            uniform float historicMax;

            // Simple CIELAB-ish mapping helpers
            vec3 professionalMap(float t) {
                // Blue to Orange diverging
                vec3 low = vec3(0.1, 0.4, 0.8);
                vec3 mid = vec3(0.95, 0.95, 0.95);
                vec3 high = vec3(0.9, 0.5, 0.1);
                if (t < 0.5) return mix(low, mid, t * 2.0);
                return mix(mid, high, (t - 0.5) * 2.0);
            }

            vec3 traditionalMap(float t) {
                // Green to Red
                return vec3(t, 1.0 - t, 0.1);
            }

            vec3 highContrastMap(float t) {
                return vec3(step(0.5, t));
            }

            void main() {
                float intensity = texture2D(texture, vTexCoord).r / historicMax;
                intensity = clamp(intensity, 0.0, 1.0);
                
                vec3 color;
                if (colorScale == 0) color = professionalMap(intensity);
                else if (colorScale == 1) color = traditionalMap(intensity);
                else if (colorScale == 2) color = vec3(intensity); // Grayscale
                else color = highContrastMap(intensity);

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
            const shader = gl.createShader(type)!;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        };

        const program = gl.createProgram()!;
        gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource));
        gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
        gl.linkProgram(program);
        gl.useProgram(program);

        // Geometries
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 0, 0,
            1, -1, 1, 0,
            -1, 1, 0, 1,
            1, 1, 1, 1,
        ]), gl.STATIC_DRAW);

        const posAttr = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(posAttr);
        gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 16, 0);

        const texAttr = gl.getAttribLocation(program, 'texCoord');
        gl.enableVertexAttribArray(texAttr);
        gl.vertexAttribPointer(texAttr, 2, gl.FLOAT, false, 16, 8);

        // Texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        textureRef.current = texture;

    }, []);

    // Update Data
    useEffect(() => {
        const gl = glRef.current;
        if (!gl || !textureRef.current) return;

        // Create a 1D slice of depth (e.g., 256 buckets)
        const bins = 256;
        const slice = new Float32Array(bins);

        // Simplified mapping: Price 0-1 mapped to 0-255
        // In real app, use min/max of current book
        [...bids, ...asks].forEach(l => {
            const idx = Math.floor(l.price * 255);
            if (idx >= 0 && idx < bins) {
                slice[idx] += l.size;
                if (slice[idx] > historicalMaxRef.current) {
                    historicalMaxRef.current = slice[idx] * 1.2; // Adaptive buffer
                }
            }
        });

        historyRef.current.push(slice);
        if (historyRef.current.length > maxHistoryPoints) {
            historyRef.current.shift();
        }

        // Upload texture
        const width = bins;
        const height = historyRef.current.length;
        const textureData = new Float32Array(width * height);

        for (let y = 0; y < height; y++) {
            textureData.set(historyRef.current[y], y * width);
        }

        gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
        // Note: WebGL 1 requires power-of-two if not clamping, 
        // but we are using Float textures or simple R8 (via luminance/alpha workaround for GLES2 compat)
        // Here we use LUMINANCE for simplicity as Float32 R-channel
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.FLOAT, textureData);

        // Draw
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    }, [bids, asks]);

    return (
        <div className="relative h-48 w-full bg-background border rounded-lg overflow-hidden group">
            <h3 className="absolute top-2 left-2 text-xs font-semibold text-muted-foreground z-10 bg-background/50 px-2 rounded">
                Liquidity Heat Map (5m)
            </h3>
            <canvas
                ref={canvasRef}
                className={`w-full h-full ${isMobile ? 'rotate-90' : ''}`}
                width={256}
                height={maxHistoryPoints}
            />

            {/* Legend / Hover Tooltip placeholder */}
            <div className="absolute bottom-2 right-2 flex gap-4 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" /> Low Depth
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500" /> High Depth
                </div>
            </div>
        </div>
    );
};
