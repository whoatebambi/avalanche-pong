'use client';

import { ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchScoreHistory, getAvalancheExplorerUrl, type ScoreRecord } from '@/utils/blockchain';
import svgPaths from '@/assets/svgs';

function AvalancheLogo() {
	return (
		<svg className="size-[14px]" fill="none" viewBox="0 0 14 14">
			<g clipPath="url(#clip0_avax)">
				<path d={svgPaths.p3b036900} fill="white" />
				<path
					clipRule="evenodd"
					d={svgPaths.p14bdf500}
					fill="#E84142"
					fillRule="evenodd"
				/>
			</g>
			<defs>
				<clipPath id="clip0_avax">
					<rect fill="white" height="14" width="14" />
				</clipPath>
			</defs>
		</svg>
	);
}

function AvaxBadge() {
	return (
		<div className="relative bg-[rgba(232,65,66,0.12)] border border-[rgba(232,65,66,0.3)] rounded-[6px] px-[7px] py-[4px] flex items-center gap-[6px]">
			<AvalancheLogo />
			<span className="font-mono text-[8px] tracking-[1px] uppercase">
				AVAX
			</span>
		</div>
	);
}

interface TransactionsHeaderProps {
	showDebugButtons?: boolean;
	debugState?: 'loading' | 'error' | 'empty' | 'data';
	onDebugStateChange?: (state: 'loading' | 'error' | 'empty' | 'data') => void;
	countdown?: number;
}

function TransactionsHeader({ showDebugButtons = false, debugState, onDebugStateChange, countdown }: TransactionsHeaderProps) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between w-full">
				<div className="flex flex-col gap-1">
					<h2 className="font-sans text-[18px] uppercase">
						TRANSACTIONS
					</h2>
					{countdown !== undefined && (
						<p className="font-mono text-[11px] opacity-40 tracking-[0.2px] uppercase">
							Next blockchain query in: {countdown}s
						</p>
					)}
				</div>
				<div className="relative">
					<AvaxBadge />
					<p className="absolute top-[3px] right-0 translate-x-[-100%] font-mono text-[11px] opacity-40 tracking-[0.2px] uppercase whitespace-nowrap">
						Fuji Testnet
					</p>
				</div>
			</div>
			{showDebugButtons && debugState && onDebugStateChange && (
				<div className="flex gap-2 items-center">
					<span className="font-mono text-[11px] opacity-40 uppercase">
						DEBUG:
					</span>
					<button
						onClick={() => onDebugStateChange('loading')}
						className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
							debugState === 'loading'
								? 'bg-[rgba(232,65,66,0.3)] border border-[rgba(232,65,66,0.5)]'
								: 'bg-[rgba(255,255,255,0.1)] opacity-60 hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)]'
						}`}
					>
						Loading
					</button>
					<button
						onClick={() => onDebugStateChange('error')}
						className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
							debugState === 'error'
								? 'bg-[rgba(232,65,66,0.3)] border border-[rgba(232,65,66,0.5)]'
								: 'bg-[rgba(255,255,255,0.1)] opacity-60 hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)]'
						}`}
					>
						Error
					</button>
					<button
						onClick={() => onDebugStateChange('empty')}
						className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
							debugState === 'empty'
								? 'bg-[rgba(232,65,66,0.3)] border border-[rgba(232,65,66,0.5)]'
								: 'bg-[rgba(255,255,255,0.1)] opacity-60 hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)]'
						}`}
					>
						Empty
					</button>
					<button
						onClick={() => onDebugStateChange('data')}
						className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
							debugState === 'data'
								? 'bg-[rgba(232,65,66,0.3)] border border-[rgba(232,65,66,0.5)]'
								: 'bg-[rgba(255,255,255,0.1)] opacity-60 hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)]'
						}`}
					>
						Data
					</button>
				</div>
			)}
		</div>
	);
}

interface Transaction {
	winner: string;
	loser: string;
	score: string;
	duration: string;
	hash: string;
	fullHash: string;
}

// Format duration from seconds to MM:SS format
function formatDuration(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function truncateHash(fullHash: string): string {
	if (fullHash.length <= 9) return fullHash;
	return `${fullHash.slice(0, 5)}…${fullHash.slice(-4)}`;
}

// Convert ScoreRecord from blockchain to Transaction format
function scoreRecordToTransaction(record: ScoreRecord): Transaction {
	return {
		winner: record.winner,
		loser: record.loser,
		score: record.score,
		duration: formatDuration(record.duration),
		hash: truncateHash(record.txHash),
		fullHash: record.txHash,
	};
}

function formatHashForTooltip(fullHash: string): string[] {
	const midpoint = Math.floor(fullHash.length / 2);
	return [fullHash.slice(0, midpoint), fullHash.slice(midpoint)];
}

function HashDisplay({ fullHash }: { fullHash: string }) {
	const truncated = truncateHash(fullHash);
	const hashLines = formatHashForTooltip(fullHash);
	
	return (
		<div className="relative group w-full h-full flex items-center">
			<span className="font-sans text-[14px] opacity-70">
				{truncated}
			</span>
			<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-3 py-1 bg-[rgba(40,40,40,1)] border border-[rgba(255,255,255,0.2)] rounded text-[12px] font-mono invisible group-hover:visible pointer-events-none shadow-lg">
				{/* Tooltip arrow */}
				<div className="absolute top-full left-1/2 -translate-x-1/2">
					{/* Border triangle - positioned to create border effect */}
					<div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-[rgba(255,255,255,0.2)]" />
					{/* Fill triangle - positioned 1px down to show border */}
					<div className="absolute top-[1px] left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-[rgba(40,40,40,1)]" />
				</div>
				<div className="flex flex-col gap-0.5 leading-tight">
					<span className="whitespace-nowrap">{hashLines[0]}</span>
					<span className="whitespace-nowrap">{hashLines[1]}</span>
				</div>
			</div>
		</div>
	);
}

interface TransactionRowProps {
	transaction: Transaction;
}

const DEFAULT_FONT_SIZE = 'text-[14px]';

function TransactionRow({ 
	transaction,
}: TransactionRowProps) {
	const explorerUrl = getAvalancheExplorerUrl(transaction.fullHash);

	return (
		<a
			href={explorerUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="relative w-full block border-t border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.02)] transition-colors overflow-visible"
		>
			<div className="flex items-center gap-1 py-2 overflow-visible">
				<TableCell 
					minWidth="min-w-24" 
					grow={true}
					fontSize={DEFAULT_FONT_SIZE}
					tracking=""
					textColor=""
					contentClassName="uppercase"
				>
					{transaction.winner}
				</TableCell>
				<TableCell 
					minWidth="min-w-10" 
					grow={true}
					fontSize={DEFAULT_FONT_SIZE}
					tracking=""
					textColor="opacity-70"
				>
					{transaction.score}
				</TableCell>
				<TableCell 
					minWidth="min-w-20" 
					grow={true}
					fontSize={DEFAULT_FONT_SIZE}
					tracking=""
					textColor="opacity-70"
				>
					{transaction.duration}
				</TableCell>
				<TableCell 
					minWidth="min-w-24" 
					grow={true}
					fontSize={DEFAULT_FONT_SIZE}
					tracking=""
					textColor="opacity-70"
					className="overflow-visible"
					rawContent={true}
				>
					<HashDisplay fullHash={transaction.fullHash} />
				</TableCell>
				<TableCell width="w-20" rawContent>
					<div className="w-full h-full flex items-center justify-center">
						<ExternalLink className="size-[14px] opacity-30" />
					</div>
				</TableCell>
			</div>
		</a>
	);
}

// Loading state component
function LoadingState() {
	return (
		<div className="flex flex-col items-center justify-center py-12 gap-3">
			<div className="size-6 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin" />
			<span className="font-sans text-[14px] opacity-60">
				Loading transactions...
			</span>
		</div>
	);
}

// Error state component
function ErrorState({ message }: { message: string }) {
	return (
		<div className="flex flex-col items-center justify-center py-12 gap-3">
			<div className="size-12 rounded-full bg-[rgba(232,65,66,0.2)] flex items-center justify-center">
				<span className="text-[#E84142] text-2xl">⚠️</span>
			</div>
			<span className="font-sans text-[14px] opacity-80 text-center">
				{message}
			</span>
			{/* TODO: Add retry button when API is integrated */}
		</div>
	);
}

// Empty state component
function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-12 gap-3">
			<div className="size-12 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
				<span className=" text-2xl opacity-60">📋</span>
			</div>
			<span className="font-sans text-[14px] opacity-60 text-center">
				No transactions found
			</span>
			<span className="font-mono text-[11px] opacity-40 text-center">
				Play a game to see transactions here
			</span>
		</div>
	);
}

// Column layout configuration - single source of truth
const COLUMN_LAYOUT = [
	{ label: 'Winner', minWidth: 'min-w-24', className: 'overflow-hidden' },
	{ label: 'Score', minWidth: 'min-w-10', className: '' },
	{ label: 'Duration', minWidth: 'min-w-20', className: '' },
	{ label: 'Hash', minWidth: 'min-w-24', className: '' },
] as const;

interface TableCellProps {
	width?: string;
	minWidth?: string;
	children?: React.ReactNode;
	className?: string;
	// CellContent props
	fontSize?: string;
	tracking?: string;
	textColor?: string;
	contentClassName?: string;
	// If rawContent is true, don't wrap with CellContent
	rawContent?: boolean;
	// If grow is true, add flex-1 to allow cell to grow
	grow?: boolean;
}

// Reusable column cell component - combines cell wrapper and content styling
function TableCell({ 
	width, 
	minWidth,
	children, 
	className = '',
	fontSize,
	tracking,
	textColor,
	contentClassName,
	rawContent = false,
	grow = false
}: TableCellProps) {
	// Default styling: 14px font size, white text
	const defaultFontSize = 'text-[14px]';
	const defaultTextColor = '';
	
	// Use minWidth if provided, otherwise use width (for backwards compatibility), otherwise use min-w-14 as fallback
	const widthClass = minWidth || width || 'min-w-14';
	const growClass = grow ? 'flex-1' : '';
	
	// Check if overflow-visible is in className, otherwise use overflow-hidden
	const overflowClass = className.includes('overflow-visible') ? '' : 'overflow-hidden';
	
	return (
		<div className={`${widthClass} ${growClass} h-10 flex items-center ${overflowClass} shrink-0 ${className}`}>
			{rawContent ? children : (
				<span className={`font-sans ${fontSize || defaultFontSize} ${textColor || defaultTextColor} truncate ${tracking || ''} ${contentClassName || ''}`}>
					{children}
				</span>
			)}
		</div>
	);
}

interface TableHeaderProps {
	onDebugToggle?: () => void;
	showDebug?: boolean;
}

function TableHeader({ onDebugToggle, showDebug }: TableHeaderProps) {
	return (
		<div className="flex items-center gap-1 py-[4px] overflow-visible">
			{COLUMN_LAYOUT.map((column) => (
				<TableCell 
					key={column.label} 
					minWidth={column.minWidth} 
					grow={true}
					className={`${column.className || ''} h-6`}
					fontSize="text-[11px]"
					tracking="tracking-[0.2px]"
					textColor="opacity-50"
					contentClassName="whitespace-nowrap uppercase"
				>
					{column.label}
				</TableCell>
			))}
			<TableCell width="w-20" rawContent className="h-6 overflow-visible relative z-10">
				{onDebugToggle && (
					<button
						type="button"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onDebugToggle();
						}}
						className={`relative z-10 px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
							showDebug
								? 'bg-[rgba(232,65,66,0.3)] border border-[rgba(232,65,66,0.5)]'
								: 'bg-[rgba(255,255,255,0.1)] opacity-60 hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)]'
						}`}
						title={showDebug ? 'Hide Debug' : 'Show Debug'}
					>
						Debug
					</button>
				)}
			</TableCell>
		</div>
	);
}

export default function Transactions() {
	// DEBUG: Toggle between different states for testing UI
	const [debugState, setDebugState] = useState<'loading' | 'error' | 'empty' | 'data'>('data');
	const [showDebug, setShowDebug] = useState(false);

	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [countdown, setCountdown] = useState<number>(30);

	const POLL_INTERVAL = 30000; // 30 seconds in milliseconds

	// Fetch transactions from blockchain
	useEffect(() => {
		async function fetchTransactions() {
			try {
				setLoading(true);
				setError(null);
				
				const records = await fetchScoreHistory();
				const formattedTransactions = records.map(scoreRecordToTransaction);
				setTransactions(formattedTransactions);
			} catch (err) {
				console.error('Error fetching transactions:', err);
				setError(err instanceof Error ? err.message : 'Failed to load transactions');
			} finally {
				setLoading(false);
				// Reset countdown after fetch completes
				setCountdown(30);
			}
		}
		
		fetchTransactions();
		
		// Poll for new transactions every 30 seconds
		const interval = setInterval(fetchTransactions, POLL_INTERVAL);
		return () => clearInterval(interval);
	}, []);

	// Countdown timer
	useEffect(() => {
		const countdownInterval = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					return 30; // Reset to 30 when it reaches 0
				}
				return prev - 1;
			});
		}, 1000); // Update every second

		return () => clearInterval(countdownInterval);
	}, []);

	// DEBUG: Use debug state to test different UI states
	const displayLoading = debugState === 'loading' || loading;
	const displayError = debugState === 'error' ? 'Failed to connect to Avalanche API' : (debugState === 'data' ? error : null);
	const displayTransactions = debugState === 'empty' ? [] : (debugState === 'data' ? transactions : []);

	return (
		<div className="backdrop-blur-[50px] bg-[rgba(81,81,81,0.24)] border border-[rgba(226,226,226,0.2)] rounded-[40px] w-full md:aspect-[1/1] relative">
			<div className="flex flex-col gap-5 px-8 py-5 h-full">
				<TransactionsHeader 
					showDebugButtons={showDebug}
					debugState={debugState}
					onDebugStateChange={setDebugState}
					countdown={countdown}
				/>
				<div className="flex flex-col gap-[9px] flex-1 min-h-0">
					<div className={`flex flex-col gap-[9px] flex-1 min-h-0 overflow-x-auto overflow-y-auto ${displayLoading || displayError || (!displayLoading && !displayError && displayTransactions.length === 0) ? 'justify-center items-center' : ''}`}>
						{displayLoading || displayError || (!displayLoading && !displayError && displayTransactions.length === 0) ? (
							<div className="w-full">
								{displayLoading && <LoadingState />}
								{displayError && <ErrorState message={displayError} />}
								{!displayLoading && !displayError && displayTransactions.length === 0 && <EmptyState />}
							</div>
						) : (
							<div className="min-w-max">
								<div className="flex-shrink-0">
									<TableHeader 
										onDebugToggle={() => setShowDebug(!showDebug)}
										showDebug={showDebug}
									/>
								</div>
								<div className="flex flex-col gap-2" style={{ paddingTop: '80px', marginTop: '-80px' }}>
									{displayTransactions.map((transaction) => (
										<TransactionRow key={transaction.fullHash} transaction={transaction} />
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
