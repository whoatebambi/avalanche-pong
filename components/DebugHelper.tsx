'use client';

import { useState } from 'react';

export type DebugState = 'loading' | 'error' | 'empty' | 'data';

interface DebugHelperProps {
	debugState: DebugState;
	onDebugStateChange: (state: DebugState) => void;
	showDebugButtons?: boolean;
}

export default function DebugHelper({ 
	debugState, 
	onDebugStateChange,
	showDebugButtons = false 
}: DebugHelperProps) {
	if (!showDebugButtons) {
		return null;
	}

	return (
		<div>
			<p className="font-mono text-[10px] opacity-40 mt-2 mb-4">
				Simulate different UI states for testing
			</p>
			<div className="flex gap-2 items-center flex-wrap">
				<button
					onClick={() => onDebugStateChange('loading')}
					className={`px-3 py-1.5 rounded text-[11px] font-mono transition-colors ${
						debugState === 'loading'
							? 'bg-[rgba(232,65,66,0.3)] border border-[rgba(232,65,66,0.5)]'
							: 'bg-[rgba(255,255,255,0.1)] opacity-60 hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)]'
					}`}
				>
					Loading
				</button>
				<button
					onClick={() => onDebugStateChange('error')}
					className={`px-3 py-1.5 rounded text-[11px] font-mono transition-colors ${
						debugState === 'error'
							? 'bg-[rgba(232,65,66,0.3)] border border-[rgba(232,65,66,0.5)]'
							: 'bg-[rgba(255,255,255,0.1)] opacity-60 hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)]'
					}`}
				>
					Error
				</button>
				<button
					onClick={() => onDebugStateChange('empty')}
					className={`px-3 py-1.5 rounded text-[11px] font-mono transition-colors ${
						debugState === 'empty'
							? 'bg-[rgba(232,65,66,0.3)] border border-[rgba(232,65,66,0.5)]'
							: 'bg-[rgba(255,255,255,0.1)] opacity-60 hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)]'
					}`}
				>
					Empty
				</button>
				<button
					onClick={() => onDebugStateChange('data')}
					className={`px-3 py-1.5 rounded text-[11px] font-mono transition-colors ${
						debugState === 'data'
							? 'bg-[rgba(232,65,66,0.3)] border border-[rgba(232,65,66,0.5)]'
							: 'bg-[rgba(255,255,255,0.1)] opacity-60 hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)]'
					}`}
				>
					Data
				</button>
			</div>
		</div>
	);
}



