'use client';

import { useEffect, useRef } from 'react';
import { ShaderBackground } from '@/utils/ShaderBackground';

interface ShaderBackgroundWrapperProps {
	colors?: [string, string, string];
}

export default function ShaderBackgroundWrapper({
	colors = ['#00ff00', '#ff00ff', '#00ffff'],
}: ShaderBackgroundWrapperProps = {}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const shaderRef = useRef<ShaderBackground | null>(null);
	const initialColorsRef = useRef(colors);

	// Update initial colors ref when colors prop changes before initialization
	useEffect(() => {
		if (!shaderRef.current) {
			initialColorsRef.current = colors;
		}
	}, [colors]);

	// Initialize shader on mount (only once)
	useEffect(() => {
		if (!containerRef.current || shaderRef.current) return;

		const width = window.innerWidth;
		const height = window.innerHeight;
		shaderRef.current = new ShaderBackground(
			containerRef.current,
			width,
			height,
			initialColorsRef.current
		);

		return () => {
			if (shaderRef.current) {
				shaderRef.current.destroy();
				shaderRef.current = null;
			}
		};
	}, []); // Only run on mount

	// Handle window resize
	useEffect(() => {
		const handleResize = () => {
			if (!shaderRef.current || !containerRef.current) return;

			const width = window.innerWidth;
			const height = window.innerHeight;

			// Update canvas size
			const canvas = shaderRef.current.getCanvas();
			if (canvas) {
				canvas.width = width;
				canvas.height = height;
				shaderRef.current.updateResolution(width, height);
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Update colors when they change (after initialization)
	useEffect(() => {
		if (shaderRef.current) {
			shaderRef.current.updateColors(colors);
		}
	}, [colors]);

	return <div ref={containerRef} className="fixed inset-0 -z-10" />;
}

