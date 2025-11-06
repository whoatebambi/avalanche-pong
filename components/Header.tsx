'use client';

import { useState, useEffect, useRef } from 'react';
import { getLatestBlock } from '@/utils/blockchain';
import svgPaths from '@/assets/svgs';
import HamburgerMenu from './HamburgerMenu';
import { type DebugState } from './DebugHelper';

function IconPong() {
	return (
		<div className="relative shrink-0 w-28">
			<svg className="block size-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 114 31">
				<g id="PONG">
					<path d={svgPaths.p359d0080} fill="var(--fill-0, #E2E2E2)" id="Vector" />
					<path d={svgPaths.p32efd300} fill="var(--fill-0, #E2E2E2)" id="Vector_2" />
					<path d={svgPaths.p42d2100} fill="var(--fill-0, #E2E2E2)" id="Vector_3" />
					<path d={svgPaths.p69b9d00} fill="var(--fill-0, #E2E2E2)" id="Vector_4" />
				</g>
			</svg>
		</div>
	);
}


function IconAvax() {
	return (
		<div className="shrink-0 self-center size-[14px]">
			<svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
				<g clipPath="url(#clip0_1_53)" id="avax-logo">
					<path d={svgPaths.p3b036900} fill="var(--fill-0, white)" id="Vector" />
					<path
						clipRule="evenodd"
						d={svgPaths.p14bdf500}
						fill="var(--fill-0, #E84142)"
						fillRule="evenodd"
						id="Vector_2"
					/>
				</g>
				<defs>
					<clipPath id="clip0_1_53">
						<rect fill="white" height="14" width="14" />
					</clipPath>
				</defs>
			</svg>
		</div>
	);
}

// Network status indicator with pulse effect
function StatusIndicator({ status }: { status: 'online' | 'offline' | 'unknown' }) {
	const color = status === 'online' ? '#00FF00' : status === 'offline' ? '#FF0000' : '#FFA500';
	
	return (
		<div className="shrink-0 self-center relative">
			<div className="relative w-2 h-2">
				<div 
					className="absolute inset-0 rounded-full animate-pulse" 
					style={{ backgroundColor: color }}
				/>
				<div 
					className="absolute inset-0 rounded-full animate-ping opacity-75" 
					style={{ backgroundColor: color }}
				/>
			</div>
		</div>
	);
}

interface SectionMobileHeaderProps {
	onDebugStateChange?: (state: DebugState) => void;
	onDebugModeChange?: (isEnabled: boolean) => void;
	debugState?: DebugState;
	githubUrl?: string;
	portfolioUrl?: string;
}

function SectionMobileHeader({ 
	onDebugStateChange,
	onDebugModeChange,
	debugState,
	githubUrl,
	portfolioUrl 
}: SectionMobileHeaderProps) {
	return (
			<div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
			<IconPong />
			<div className="md:hidden">
				<HamburgerMenu
					onDebugStateChange={onDebugStateChange}
					onDebugModeChange={onDebugModeChange}
					debugState={debugState}
					githubUrl={githubUrl}
					portfolioUrl={portfolioUrl}
				/>
			</div>
		</div>
	);
}

function LabelBlockchain({ text }: { text: string }) {
	return (
		<div className="relative shrink-0">
			<div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-2 items-start relative">
				<p className="font-mono font-normal leading-[normal] relative shrink-0 text-[11px] opacity-40 text-nowrap uppercase tracking-[0.2px] whitespace-pre">
					{text}
				</p>
			</div>
		</div>
	);
}

function ValueBlockchain({ text, icon, statusIndicator }: { text: string; icon?: 'avalanche'; statusIndicator?: React.ReactNode }) {
	const gap = icon || statusIndicator ? 'gap-2' : '';
	const iconElement = icon === 'avalanche' ? <IconAvax /> : null;

	return (
		<div className="relative shrink-0">
			<div
				className={`bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex ${gap} items-start relative`}
			>
				{iconElement}
				{statusIndicator}
				<p className="font-sans font-normal leading-[normal] relative shrink-0 text-[16px] text-nowrap uppercase whitespace-pre">
					{text}
				</p>
			</div>
		</div>
	);
}

// Adapted from https://reactbits.dev/text-animations/decrypted-text
function AnimatedBlockNumber({ value }: { value: string }) {
	const [displayValue, setDisplayValue] = useState(value);
	const valueRef = useRef(value);
	const animationRef = useRef<number | null>(null);
	const frameRef = useRef(0);

	const chars = '0123456789,';

	useEffect(() => {
		if (value !== valueRef.current) {
			const targetValue = value;
			const startValue = valueRef.current;
			const duration = 1200; // 1.2 second animation
			const startTime = Date.now();
			frameRef.current = 0;

			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}

			const animate = () => {
				const now = Date.now();
				const elapsed = now - startTime;
				const progress = Math.min(elapsed / duration, 1);

				let decrypted = '';
				const staggerTimeMs = 50; // Time between each character starting to decrypt (ms)
				const charDecryptTimeMs = 200; // Time each character takes to decrypt (ms)
				
				for (let i = 0; i < targetValue.length; i++) {
					// Calculate when each character should start decrypting (staggered)
					const charStartTime = i * staggerTimeMs;
					const charEndTime = charStartTime + charDecryptTimeMs;
					
					if (elapsed >= charEndTime) {
						// Character is fully decrypted
						decrypted += targetValue[i];
					} else if (elapsed >= charStartTime) {
						// Character is decrypting, show random chars
						const randomChar = chars[Math.floor(Math.random() * chars.length)];
						decrypted += randomChar;
					} else {
						// Character hasn't started decrypting yet, show from start value or random
						if (i < startValue.length) {
							decrypted += startValue[i];
						} else {
							const randomChar = chars[Math.floor(Math.random() * chars.length)];
							decrypted += randomChar;
						}
					}
				}

				setDisplayValue(decrypted);

				if (progress < 1) {
					frameRef.current++;
					animationRef.current = requestAnimationFrame(animate);
				} else {
					setDisplayValue(targetValue);
					valueRef.current = targetValue;
					animationRef.current = null;
				}
			};

			animationRef.current = requestAnimationFrame(animate);
		} else {
			setDisplayValue(value);
			valueRef.current = value;
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [value]);

	return (
		<div className="relative shrink-0">
			<p className="font-sans font-normal leading-[normal] relative shrink-0 text-[16px] text-nowrap uppercase whitespace-pre font-mono">
				{displayValue}
			</p>
		</div>
	);
}

function Section({
	labelText,
	valueText,
	valueIcon,
	isLive = false,
	statusIndicator,
}: {
	labelText: string;
	valueText: string;
	valueIcon?: 'avalanche';
	isLive?: boolean;
	statusIndicator?: React.ReactNode;
}) {
	return (
		<div
			className="content-stretch flex flex-col gap-1 items-start relative shrink-0"
		>
			<LabelBlockchain text={labelText} />
			{isLive ? (
				<AnimatedBlockNumber value={valueText} />
			) : (
				<ValueBlockchain text={valueText} icon={valueIcon} statusIndicator={statusIndicator} />
			)}
		</div>
	);
}

interface HeaderProps {
	onDebugStateChange?: (state: DebugState) => void;
	onDebugModeChange?: (isEnabled: boolean) => void;
	debugState?: DebugState;
	githubUrl?: string;
	portfolioUrl?: string;
}

export default function Header({ 
	onDebugStateChange,
	onDebugModeChange,
	debugState,
	githubUrl,
	portfolioUrl 
}: HeaderProps) {
	const [latestBlock, setLatestBlock] = useState<string>('69,650,428');
	const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');
	const previousBlockRef = useRef<string>('69,650,428');

	// Format block number with commas
	const formatBlockNumber = (blockNumber: number): string => {
		return blockNumber.toLocaleString('en-US');
	};

	// Fetch latest block from Avalanche Fuji Testnet
	const fetchLatestBlock = async () => {
		try {
			const blockNumber = await getLatestBlock();
			setNetworkStatus('online');
			
			const formatted = formatBlockNumber(blockNumber);
			
			if (formatted !== previousBlockRef.current) {
				previousBlockRef.current = latestBlock;
				setLatestBlock(formatted);
			}
		} catch (error) {
			console.error('Failed to fetch latest block:', error);
			setNetworkStatus('offline');
		}
	};

	useEffect(() => {
		fetchLatestBlock();
		const interval = setInterval(fetchLatestBlock, 5000);
		return () => clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div
			className="backdrop-blur-[50px] backdrop-filter bg-[rgba(81,81,81,0.24)] rounded-[40px] w-full max-w-[520px] md:max-w-[1080px] mx-auto overflow-visible"
		>
			<div className="absolute border-[0.5px] border-[rgba(226,226,226,0.2)] border-solid inset-0 pointer-events-none rounded-[40px]" />

			{/* Mobile/Stacked Layout */}
			<div className="flex flex-col gap-4 items-start px-8 py-6 md:hidden relative w-full overflow-visible">
				<SectionMobileHeader 
					onDebugStateChange={onDebugStateChange}
					onDebugModeChange={onDebugModeChange}
					debugState={debugState}
					githubUrl={githubUrl}
					portfolioUrl={portfolioUrl}
				/>
				<Section labelText="Network" valueText="Avalanche" valueIcon="avalanche" />
				<Section 
					labelText="Testnet" 
					valueText="Fuji C-Chain" 
					statusIndicator={<StatusIndicator status={networkStatus} />}
				/>
				<Section labelText="Latest block" valueText={latestBlock} isLive={true} />
			</div>

			{/* Desktop Layout */}
			<div className="hidden md:flex flex-row items-center w-full relative min-h-[88px] overflow-visible">
				<div className="absolute left-8 flex gap-8 items-center">
					<div className="content-stretch flex gap-6 items-center relative shrink-0">
						<IconPong />
					</div>
					<div className="flex gap-8 items-center">
						<Section labelText="Network" valueText="Avalanche" valueIcon="avalanche" />
						<Section 
							labelText="Testnet" 
							valueText="Fuji C-Chain" 
							statusIndicator={<StatusIndicator status={networkStatus} />}
						/>
						<Section labelText="Latest block" valueText={latestBlock} isLive={true} />
					</div>
				</div>
				<div className="absolute right-8 z-50">
					<HamburgerMenu
						onDebugStateChange={onDebugStateChange}
						onDebugModeChange={onDebugModeChange}
						debugState={debugState}
						githubUrl={githubUrl}
						portfolioUrl={portfolioUrl}
					/>
				</div>
			</div>
		</div>
	);
}
