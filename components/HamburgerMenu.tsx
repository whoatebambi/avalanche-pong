'use client';

import { useState, useRef, useEffect } from 'react';
import { Github, ExternalLink } from 'lucide-react';
import DebugHelper, { type DebugState } from './DebugHelper';

interface HamburgerMenuProps {
	onDebugStateChange?: (state: DebugState) => void;
	onDebugModeChange?: (isEnabled: boolean) => void;
	debugState?: DebugState;
	githubUrl?: string;
	portfolioUrl?: string;
}

export default function HamburgerMenu({ 
	onDebugStateChange,
	onDebugModeChange,
	debugState = 'data',
	githubUrl = 'https://github.com',
	portfolioUrl = '#'
}: HamburgerMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [showDebug, setShowDebug] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Notify parent when debug mode changes
	useEffect(() => {
		if (onDebugModeChange) {
			onDebugModeChange(showDebug);
		}
	}, [showDebug, onDebugModeChange]);

	// Close menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				menuRef.current &&
				buttonRef.current &&
				!menuRef.current.contains(event.target as Node) &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				setShowDebug(false);
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	const handleDebugClick = () => {
		setShowDebug(!showDebug);
		// Keep menu open when toggling debug
	};

	const handleMenuItemClick = (action: () => void) => {
		action();
		// Don't close menu for debug, but close for other items
		if (action !== handleDebugClick) {
			setIsOpen(false);
		}
	};

	return (
		<div className="relative z-50">
			<button
				ref={buttonRef}
				onClick={() => setIsOpen(!isOpen)}
				className="relative shrink-0 size-[40px] flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors z-50"
				aria-label="Menu"
				aria-expanded={isOpen}
			>
				<svg 
					className="block size-[20px] transition-transform duration-200" 
					fill="none" 
					viewBox="0 0 21 16"
					style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
				>
					<path
						d="M21 15.75H0V14H21V15.75ZM21 8.75H0V7H21V8.75ZM21 1.75H0V0H21V1.75Z"
						fill="currentColor"
					/>
				</svg>
			</button>

			{isOpen && (
				<div
					ref={menuRef}
					className="absolute right-0 top-full mt-2 w-64 bg-[rgba(40,40,40,0.95)] border border-[rgba(255,255,255,0.2)] rounded-lg shadow-lg backdrop-blur-sm z-[100] overflow-hidden"
					style={{ minWidth: '200px' }}
				>
					<div className="flex flex-col py-2">
						{/* GitHub Menu Item */}
						<a
							href={githubUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-3 px-4 py-2.5 hover:bg-[rgba(255,255,255,0.1)] transition-colors group"
							onClick={() => setIsOpen(false)}
						>
							<Github className="size-4 opacity-70 group-hover:opacity-100 transition-opacity" />
							<span className="font-sans text-[14px] uppercase">Github</span>
							<ExternalLink className="size-3 opacity-40 ml-auto group-hover:opacity-60 transition-opacity" />
						</a>

						{/* Portfolio Menu Item */}
						<a
							href={portfolioUrl}
							target={portfolioUrl === '#' ? undefined : '_blank'}
							rel={portfolioUrl === '#' ? undefined : 'noopener noreferrer'}
							className="flex items-center gap-3 px-4 py-2.5 hover:bg-[rgba(255,255,255,0.1)] transition-colors group"
							onClick={() => setIsOpen(false)}
						>
							<span className="font-sans text-[14px] uppercase">Portfolio</span>
							{portfolioUrl !== '#' && (
								<ExternalLink className="size-3 opacity-40 ml-auto group-hover:opacity-60 transition-opacity" />
							)}
						</a>

						{/* Divider */}
						<div className="h-px bg-[rgba(255,255,255,0.1)] my-1" />

						{/* Debug Menu Item */}
						<button
							onClick={() => handleMenuItemClick(handleDebugClick)}
							className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[rgba(255,255,255,0.1)] transition-colors text-left ${
								showDebug ? 'bg-[rgba(232,65,66,0.15)]' : ''
							}`}
						>
							<span className="font-sans text-[14px] uppercase">Debug</span>
							{showDebug && (
								<span className="ml-auto font-mono text-[10px] opacity-60">ON</span>
							)}
						</button>

						{/* Debug Helper Panel */}
						{showDebug && onDebugStateChange && (
							<div className="px-4 pb-4 pt-2 border-t border-[rgba(255,255,255,0.1)] mt-2">
								<DebugHelper
									debugState={debugState}
									onDebugStateChange={onDebugStateChange}
									showDebugButtons={true}
								/>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

