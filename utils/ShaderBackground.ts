// Convert hex color to HSL values for spectral modulation
const hexToHsl = (hex: string): [number, number, number] => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return [0.5, 0.5, 0.5];

	const r = parseInt(result[1], 16) / 255;
	const g = parseInt(result[2], 16) / 255;
	const b = parseInt(result[3], 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0,
		s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}

	return [h, s, l];
};

export class ShaderBackground {
	private canvas: HTMLCanvasElement;
	private gl: WebGLRenderingContext | null = null;
	private program: WebGLProgram | null = null;
	private animationId: number | null = null;
	private colors: [string, string, string];
	private positionLocation: number = -1;
	private resolutionLocation: WebGLUniformLocation | null = null;
	private timeLocation: WebGLUniformLocation | null = null;
	private hueShiftLocation: WebGLUniformLocation | null = null;
	private saturationLocation: WebGLUniformLocation | null = null;
	private brightnessLocation: WebGLUniformLocation | null = null;

	constructor(
		private container: HTMLElement,
		private width: number,
		private height: number,
		initialColors: [string, string, string]
	) {
		this.colors = initialColors;
		this.canvas = document.createElement('canvas');
		this.canvas.width = width;
		this.canvas.height = height;
		this.canvas.className = 'absolute inset-0';
		this.canvas.style.display = 'block';
		this.container.appendChild(this.canvas);

		this.initWebGL();
		this.animate(0);
	}

	private initWebGL() {
		this.gl = this.canvas.getContext('webgl');
		if (!this.gl) {
			console.error('WebGL not supported');
			return;
		}

		// Vertex shader source
		const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

		// Fragment shader source with original spectral function + modulation
		const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHueShift;
      uniform float uSaturation;
      uniform float uBrightness;

      vec3 spectral_colour(float l) {
        float r=0.0,g=0.0,b=0.0;
        if ((l>=400.0)&&(l<410.0)) { float t=(l-400.0)/(410.0-400.0); r=+(0.33*t)-(0.20*t*t); }
        else if ((l>=410.0)&&(l<475.0)) { float t=(l-410.0)/(475.0-410.0); r=0.14-(0.13*t*t); }
        else if ((l>=545.0)&&(l<595.0)) { float t=(l-545.0)/(595.0-545.0); r=+(1.98*t)-(t*t); }
        else if ((l>=595.0)&&(l<650.0)) { float t=(l-595.0)/(650.0-595.0); r=0.98+(0.06*t)-(0.40*t*t); }
        else if ((l>=650.0)&&(l<700.0)) { float t=(l-650.0)/(700.0-650.0); r=0.65-(0.84*t)+(0.20*t*t); }
        if ((l>=415.0)&&(l<475.0)) { float t=(l-415.0)/(475.0-415.0); g=+(0.80*t*t); }
        else if ((l>=475.0)&&(l<590.0)) { float t=(l-475.0)/(590.0-475.0); g=0.8+(0.76*t)-(0.80*t*t); }
        else if ((l>=585.0)&&(l<639.0)) { float t=(l-585.0)/(639.0-585.0); g=0.82-(0.80*t); }
        if ((l>=400.0)&&(l<475.0)) { float t=(l-400.0)/(475.0-400.0); b=+(2.20*t)-(1.50*t*t); }
        else if ((l>=475.0)&&(l<560.0)) { float t=(l-475.0)/(560.0-475.0); b=0.7-(t)+(0.30*t*t); }
        return vec3(r,g,b);
      }

      // HSV to RGB conversion
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }

      // RGB to HSV conversion
      vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
      }

      void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        vec2 p = (2.0*fragCoord.xy - iResolution.xy) / min(iResolution.x, iResolution.y);
        p *= 2.0;
        
        for(int i=0;i<8;i++) {
          vec2 newp = vec2(
            p.y + cos(p.x + iTime) - sin(p.y * cos(iTime * 0.2)),
            p.x - sin(p.y - iTime) - cos(p.x * sin(iTime * 0.3))
          );
          p = newp;
        }
        
        // Get original spectral color
        vec3 spectralColor = spectral_colour(p.y * 50.0 + 500.0 + sin(iTime * 0.6));
        
        // Convert to HSV for modulation
        vec3 hsv = rgb2hsv(spectralColor);
        
        // Apply modulations
        hsv.x = fract(hsv.x + uHueShift); // Hue shift
        hsv.y = clamp(hsv.y * uSaturation, 0.0, 1.0); // Saturation
        hsv.z = clamp(hsv.z * uBrightness, 0.0, 1.0); // Brightness
        
        // Convert back to RGB
        vec3 finalColor = hsv2rgb(hsv);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

		const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
		const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

		if (!vertexShader || !fragmentShader) return;

		this.program = this.gl.createProgram()!;
		this.gl.attachShader(this.program, vertexShader);
		this.gl.attachShader(this.program, fragmentShader);
		this.gl.linkProgram(this.program);

		if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
			console.error('Program link error:', this.gl.getProgramInfoLog(this.program));
			return;
		}

		// Set up geometry and uniforms
		this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
		this.resolutionLocation = this.gl.getUniformLocation(this.program, 'iResolution');
		this.timeLocation = this.gl.getUniformLocation(this.program, 'iTime');
		this.hueShiftLocation = this.gl.getUniformLocation(this.program, 'uHueShift');
		this.saturationLocation = this.gl.getUniformLocation(this.program, 'uSaturation');
		this.brightnessLocation = this.gl.getUniformLocation(this.program, 'uBrightness');

		const positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
			this.gl.STATIC_DRAW
		);

		this.gl.viewport(0, 0, this.width, this.height);
	}

	private createShader(type: number, source: string): WebGLShader | null {
		if (!this.gl) return null;

		const shader = this.gl.createShader(type);
		if (!shader) return null;

		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);

		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
			this.gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	private animate = (time: number) => {
		if (!this.gl || !this.program) {
			this.animationId = null;
			return;
		}

		try {
			// Convert colors to modulation parameters
			const hsl1 = hexToHsl(this.colors[0]);
			const hsl2 = hexToHsl(this.colors[1]);
			const hsl3 = hexToHsl(this.colors[2]);

			// Use the colors to control spectral parameters
			const hueShift = hsl1[0]; // Use first color's hue for hue shift
			const saturation = hsl2[1] + 0.5; // Use second color's saturation (offset for visibility)
			const brightness = hsl3[2] + 0.5; // Use third color's lightness (offset for visibility)

			this.gl.clearColor(0, 0, 0, 1);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);

			this.gl.useProgram(this.program);

			this.gl.enableVertexAttribArray(this.positionLocation);
			this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);

			this.gl.uniform2f(this.resolutionLocation, this.width, this.height);
			this.gl.uniform1f(this.timeLocation, time * 0.001);
			this.gl.uniform1f(this.hueShiftLocation, hueShift);
			this.gl.uniform1f(this.saturationLocation, saturation);
			this.gl.uniform1f(this.brightnessLocation, brightness);

			this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

			this.animationId = requestAnimationFrame(this.animate);
		} catch (error) {
			console.error('Error in shader animation:', error);
			this.animationId = null;
		}
	};

	public updateColors(colors: [string, string, string]) {
		this.colors = colors;
	}

	public updateResolution(width: number, height: number) {
		this.width = width;
		this.height = height;
		if (this.gl) {
			this.gl.viewport(0, 0, width, height);
		}
	}

	public getCanvas(): HTMLCanvasElement | null {
		return this.canvas;
	}

	public destroy() {
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
		if (this.program && this.gl) {
			this.gl.deleteProgram(this.program);
			this.program = null;
		}
		if (this.canvas.parentNode) {
			this.canvas.parentNode.removeChild(this.canvas);
		}
		this.gl = null;
	}
}
