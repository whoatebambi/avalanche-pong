'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { submitScore } from '@/utils/blockchain';

// Game constants
const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 300;
const PADDLE_WIDTH = 8;
const PADDLE_HEIGHT = 60;
const BALL_SIZE = 8;
// Paddle constants
const PADDLE_BASE_SPEED = 5;
const PADDLE_ACCELERATION = 0.8; // Increased for more responsive quick taps
const PADDLE_DECELERATION = 0.2;
const PADDLE_MAX_SPEED = 6;
const PADDLE_MIN_VELOCITY = 1.5; // Minimum velocity boost on key press for quick taps
const CENTERED_PADDLE_Y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;

// Ball speed constants
const BALL_SPEED_BASE = 3; // Starting speed
const BALL_SPEED_MAX = 4.5; // Maximum speed
const BALL_SPEED_INCREASE_RATE = 0.1; // Speed multiplier increase per second
const BALL_SPEED_INCREASE_INTERVAL = 1000; // Increase speed every 1 second (in ms)
const BALL_SPEED_Y_RATIO = 0.75; // Y speed relative to X speed

type GameMode = '1v1' | '1vAI' | null;

interface GameState {
	ballX: number;
	ballY: number;
	ballSpeedX: number;
	ballSpeedY: number;
	ballSpeedMultiplier: number; // Current speed multiplier (starts at 1, increases over time)
	leftPaddleY: number;
	rightPaddleY: number;
	leftPaddleVelocity: number;
	rightPaddleVelocity: number;
	keys: Record<string, boolean>;
}

// UI Components
function ScoreDisplay({
	leftScore,
	rightScore,
	player1Name,
	player2Name,
	gameMode,
	visible,
}: {
	leftScore: number;
	rightScore: number;
	player1Name: string;
	player2Name: string;
	gameMode: GameMode;
	visible: boolean;
}) {
	return (
		<div
			className={`absolute left-0 right-0 flex justify-between px-8 z-10 ${
				!visible ? 'opacity-0 pointer-events-none' : ''
			}`}
		>
			<div className="flex flex-col items-center gap-1">
				<p className="font-mono font-normal text-[48px]">
					{leftScore}
				</p>
				<p className="font-mono font-normal text-[14px] opacity-60">
					{player1Name || 'Player 1'}
              </p>
          </div>
			<div className="flex flex-col items-center gap-1">
				<p className="font-mono font-normal text-[48px]">
					{rightScore}
				</p>
				<p className="font-mono font-normal text-[14px] opacity-60">
					{gameMode === '1vAI' ? 'AI' : player2Name || 'Player 2'}
            </p>
          </div>
        </div>
	);
}

function StartScreenOverlay({ onPlayClick }: { onPlayClick: () => void }) {
	return (
		<div className="overlay absolute inset-0 rounded-[48px] flex flex-col items-center justify-center gap-4 z-20">
			<button
				onClick={onPlayClick}
				className="font-mono text-[18px] uppercase px-12 py-4 backdrop-blur-xl bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded-2xl hover:bg-[rgba(255,255,255,0.2)] transition-all"
			>
          Play
        </button>
		</div>
	);
}

function ModeSelectionOverlay({
	onModeSelect,
	onBack,
}: {
	onModeSelect: (mode: '1v1' | '1vAI') => void;
	onBack: () => void;
}) {
	return (
		<div className="overlay absolute inset-0 backdrop-blur-sm bg-[rgba(0,0,0,0.3)] rounded-[48px] flex flex-col items-center justify-center gap-3 z-20">
			<div className="font-mono text-[18px] uppercase mb-2 opacity-60">
          Select Mode
        </div>
			<button
				onClick={() => onModeSelect('1vAI')}
				className="font-mono text-[16px] uppercase px-10 py-3 backdrop-blur-xl bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded-2xl hover:bg-[rgba(255,255,255,0.2)] transition-all w-48"
			>
          1 vs AI
        </button>
			<button
				onClick={() => onModeSelect('1v1')}
				className="font-mono text-[16px] uppercase px-10 py-3 backdrop-blur-xl bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded-2xl hover:bg-[rgba(255,255,255,0.2)] transition-all w-48"
			>
          1 vs 1
        </button>
			<button
				onClick={onBack}
				className="font-mono text-[12px] uppercase px-6 py-2 backdrop-blur-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-2xl hover:bg-[rgba(255,255,255,0.1)] transition-all mt-2"
			>
          Back
        </button>
		</div>
	);
}

// Validation helper functions
function validatePlayerName(name: string): string | null {
	if (name.length < 3) {
		return 'Name must be at least 3 characters';
	}
	if (name.length > 9) {
		return 'Name must be at most 9 characters';
	}
	if (name.includes(' ')) {
		return 'Name cannot contain spaces';
	}
	return null;
}

function validateNames(
	player1Name: string,
	player2Name: string,
	gameMode: GameMode
): { player1Error: string | null; player2Error: string | null } {
	const player1Error = validatePlayerName(player1Name);
	let player2Error: string | null = null;

	if (gameMode === '1v1') {
		player2Error = validatePlayerName(player2Name);
		if (!player1Error && !player2Error && player1Name.toLowerCase() === player2Name.toLowerCase()) {
			return {
				player1Error: 'Names must be different',
				player2Error: 'Names must be different',
			};
		}
	}

	return { player1Error, player2Error };
}

function NameInputOverlay({
	gameMode,
	player1Name,
	player2Name,
	onPlayer1NameChange,
	onPlayer2NameChange,
	onStart,
	onBack,
	startDelay,
	player1Error,
	player2Error,
	isValid,
}: {
	gameMode: GameMode;
	player1Name: string;
	player2Name: string;
	onPlayer1NameChange: (name: string) => void;
	onPlayer2NameChange: (name: string) => void;
	onStart: () => void;
	onBack: () => void;
	startDelay: number | null;
	player1Error: string | null;
	player2Error: string | null;
	isValid: boolean;
}) {
	return (
		<div className="overlay absolute inset-0 backdrop-blur-sm bg-[rgba(0,0,0,0.3)] rounded-[48px] flex flex-col items-center justify-center gap-4 z-20 px-12">
			{startDelay !== null ? (
				<div className="flex flex-col items-center gap-4">
					<div className="font-mono text-[48px] uppercase">
						{startDelay}
					</div>
					<div className="font-mono text-[14px] uppercase opacity-60">
						Starting game...
					</div>
				</div>
			) : (
				<>
					<div className="font-mono text-[18px] uppercase mb-2 opacity-60">
						Enter {gameMode === '1v1' ? 'Player Names' : 'Your Name'}
					</div>
					<div className="flex flex-col gap-2 items-center">
						<input
							type="text"
							autoComplete="off"
							name="player1-name"
							id="player1-name-input"
							role="textbox"
							aria-label="Player 1 name input"
							data-lpignore="true"
							data-form-type="other"
							spellCheck="false"
							autoCapitalize="off"
							autoCorrect="off"
							placeholder="Player 1"
							value={player1Name}
							onChange={(e) => onPlayer1NameChange(e.target.value)}
							className={`font-mono text-[14px] px-4 py-3 backdrop-blur-xl bg-[rgba(255,255,255,0.1)] border rounded-xl focus:bg-[rgba(255,255,255,0.15)] focus:outline-none transition-all w-64 placeholder:opacity-40 ${
								player1Error
									? 'border-[rgba(255,0,0,0.5)]'
									: 'border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]'
							}`}
							maxLength={9}
						/>
						{player1Error && (
							<div className="font-mono text-[11px] text-[rgba(255,0,0,0.8)] text-center">
								{player1Error}
							</div>
						)}
					</div>
					{gameMode === '1v1' && (
						<div className="flex flex-col gap-2 items-center">
							<input
								type="text"
								autoComplete="off"
								name="player2-name"
								id="player2-name-input"
								role="textbox"
								aria-label="Player 2 name input"
								data-lpignore="true"
								data-form-type="other"
								spellCheck="false"
								autoCapitalize="off"
								autoCorrect="off"
								placeholder="Player 2"
								value={player2Name}
								onChange={(e) => onPlayer2NameChange(e.target.value)}
								className={`font-mono text-[14px] px-4 py-3 backdrop-blur-xl bg-[rgba(255,255,255,0.1)] border rounded-xl focus:bg-[rgba(255,255,255,0.15)] focus:outline-none transition-all w-64 placeholder:opacity-40 ${
									player2Error
										? 'border-[rgba(255,0,0,0.5)]'
										: 'border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]'
								}`}
								maxLength={9}
							/>
							{player2Error && (
								<div className="font-mono text-[11px] text-[rgba(255,0,0,0.8)] text-center">
									{player2Error}
								</div>
							)}
						</div>
					)}
					<div className="flex gap-3 mt-2">
						<button
							onClick={onBack}
							className="font-mono text-[14px] uppercase px-6 py-3 backdrop-blur-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-2xl hover:bg-[rgba(255,255,255,0.1)] transition-all"
						>
							Back
						</button>
						<button
							onClick={onStart}
							disabled={!isValid}
							className={`font-mono text-[14px] uppercase px-8 py-3 backdrop-blur-xl border rounded-2xl transition-all ${
								isValid
									? 'bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.2)] cursor-pointer'
									: 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] opacity-50 cursor-not-allowed'
							}`}
						>
							Start Game
						</button>
					</div>
				</>
			)}
		</div>
	);
}

function GameOverOverlay({
	winner,
	onBack,
	onPlayAgain,
	startDelay,
}: {
	winner: string;
	onBack: () => void;
	onPlayAgain: () => void;
	startDelay: number | null;
}) {
	return (
		<div className="overlay absolute inset-0 backdrop-blur-sm bg-[rgba(0,0,0,0.5)] rounded-[48px] flex flex-col items-center justify-center gap-4 z-20">
			{startDelay !== null ? (
				<div className="flex flex-col items-center gap-4">
					<div className="font-mono text-[48px] uppercase">
						{startDelay}
					</div>
					<div className="font-mono text-[14px] uppercase opacity-60">
						Starting game...
					</div>
				</div>
			) : (
				<>
					<div className="font-sans text-[24px] uppercase">
						{winner} wins!
					</div>
					<div className="flex gap-3">
						<button
							onClick={onBack}
							className="font-sans text-[14px] uppercase px-6 py-3 backdrop-blur-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-2xl hover:bg-[rgba(255,255,255,0.1)] transition-all"
						>
							Back
						</button>
						<button
							onClick={onPlayAgain}
							className="font-sans text-[14px] uppercase px-6 py-3 backdrop-blur-xl bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded-2xl hover:bg-[rgba(255,255,255,0.2)] transition-all"
						>
							Play Again
						</button>
					</div>
				</>
			)}
		</div>
	);
}

function TransactionNotification({ txHash }: { txHash: string }) {
	return (
		<div className="overlay absolute top-4 left-1/2 -translate-x-1/2 z-30 backdrop-blur-xl bg-[rgba(0,255,0,0.15)] border border-[rgba(0,255,0,0.3)] rounded-2xl px-4 py-2 flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="text-green-400"
			>
				<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
				<path d="m9 12 2 2 4-4" />
        </svg>
			<span className="font-mono text-[12px] uppercase tracking-[-0.24px]">
				TX: {txHash}
        </span>
		</div>
	);
}

export default function PlayablePongGame() {
	// Game state
	const [gameStarted, setGameStarted] = useState(false);
	const gameStartTimeRef = useRef<number | null>(null);
	const [gameOver, setGameOver] = useState(false);
	const [winner, setWinner] = useState<string | null>(null);
	const [leftScore, setLeftScore] = useState(0);
	const [rightScore, setRightScore] = useState(0);
	const [showModeSelection, setShowModeSelection] = useState(false);
	const [showNameInput, setShowNameInput] = useState(false);
	const [gameMode, setGameMode] = useState<GameMode>(null);
	const [player1Name, setPlayer1Name] = useState('');
	const [player2Name, setPlayer2Name] = useState('');
	const [player1Error, setPlayer1Error] = useState<string | null>(null);
	const [player2Error, setPlayer2Error] = useState<string | null>(null);
	const [lastTxHash, setLastTxHash] = useState<string | null>(null);
	const [showTxNotification, setShowTxNotification] = useState(false);
	const [startDelay, setStartDelay] = useState<number | null>(null);

	// Canvas and game loop refs
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
	const gameStateRef = useRef<GameState>({
		ballX: 210,
		ballY: 150,
		// Initialize with random direction for demo mode
		ballSpeedX: (Math.random() < 0.5 ? -1 : 1) * BALL_SPEED_BASE,
		ballSpeedY: (Math.random() - 0.5) * BALL_SPEED_BASE * BALL_SPEED_Y_RATIO * 2,
		ballSpeedMultiplier: 1,
		leftPaddleY: CENTERED_PADDLE_Y,
		rightPaddleY: CENTERED_PADDLE_Y,
		leftPaddleVelocity: 0,
		rightPaddleVelocity: 0,
		keys: {},
	});
	const lastBallSpeedIncreaseRef = useRef<number>(0);
	const animationIdRef = useRef<number | null>(null);
	const keysRef = useRef<Record<string, boolean>>({});
	const leftScoreRef = useRef(0);
	const rightScoreRef = useRef(0);
	const isFirstLaunchRef = useRef(true);

	// Initialize canvas
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = CANVAS_WIDTH;
		canvas.height = CANVAS_HEIGHT;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			console.error('Failed to get canvas context');
			return;
		}
		ctxRef.current = ctx;
	}, []);

	// Keyboard event handlers
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			keysRef.current[e.key] = true;
			gameStateRef.current.keys[e.key] = true;
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			keysRef.current[e.key] = false;
			gameStateRef.current.keys[e.key] = false;
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, []);

	// Draw game on canvas
	const drawGame = useCallback(() => {
		const ctx = ctxRef.current;
		if (!ctx) return;

		const state = gameStateRef.current;

		ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		// Draw center line
		ctx.strokeStyle = 'rgba(226, 226, 226, 0.4)';
		ctx.lineWidth = 2;
		ctx.setLineDash([10, 10]);
		ctx.beginPath();
		ctx.moveTo(CANVAS_WIDTH / 2, 0);
		ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
		ctx.stroke();
		ctx.setLineDash([]);

		// Draw paddles
		ctx.fillStyle = '#d9d9d9';
		ctx.fillRect(20, state.leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
		ctx.fillRect(
			CANVAS_WIDTH - PADDLE_WIDTH - 20,
			state.rightPaddleY,
			PADDLE_WIDTH,
			PADDLE_HEIGHT
		);

		// Draw ball
		ctx.fillStyle = '#d9d9d9';
		ctx.fillRect(state.ballX, state.ballY, BALL_SIZE, BALL_SIZE);
	}, []);

	// Record win on blockchain
	const recordWinOnBlockchain = useCallback(async (winner: 'left' | 'right', finalScore: string) => {
		try {
			// Calculate game duration in seconds
			const duration = gameStartTimeRef.current 
				? Math.floor((Date.now() - gameStartTimeRef.current) / 1000)
				: 0;

			// Determine winner and loser names
			const winnerName = winner === 'left' 
				? player1Name || 'Player 1'
				: (gameMode === '1vAI' ? 'AI' : player2Name || 'Player 2');
			
			const loserName = winner === 'left'
				? (gameMode === '1vAI' ? 'AI' : player2Name || 'Player 2')
				: player1Name || 'Player 1';

			// Submit score to blockchain
			const result = await submitScore(winnerName, loserName, finalScore, duration);

			if (result.success && result.txHash) {
				setLastTxHash(result.txHash);
				setShowTxNotification(true);

				setTimeout(() => {
					setShowTxNotification(false);
				}, 5000);

				console.log(
					`Score recorded on Avalanche Fuji Testnet: ${result.txHash}`,
					`Winner: ${winnerName}, Score: ${finalScore}, Duration: ${duration}s`
				);
			} else {
				console.error('Failed to submit score:', result.error);
				// Still show notification with error
				setLastTxHash(null);
				setShowTxNotification(true);
				setTimeout(() => {
					setShowTxNotification(false);
				}, 5000);
			}
		} catch (error) {
			console.error('Error recording win on blockchain:', error);
			setShowTxNotification(true);
			setTimeout(() => {
				setShowTxNotification(false);
			}, 5000);
		}
	}, [player1Name, player2Name, gameMode]);

	// Helper function to launch the ball with random direction
	const launchBall = useCallback((isFirstLaunch: boolean) => {
		const state = gameStateRef.current;
		// Reset ball to center
		state.ballX = CANVAS_WIDTH / 2;
		state.ballY = CANVAS_HEIGHT / 2;
		
		// Reset speed multiplier on first launch, keep current multiplier otherwise
		if (isFirstLaunch) {
			state.ballSpeedMultiplier = 1;
			lastBallSpeedIncreaseRef.current = Date.now();
		}
		
		// Random direction (50/50 chance left or right)
		const direction = Math.random() < 0.5 ? -1 : 1;
		
		// Use current speed multiplier with base speed
		const currentSpeed = Math.min(BALL_SPEED_BASE * state.ballSpeedMultiplier, BALL_SPEED_MAX);
		const speedX = currentSpeed;
		const speedY = currentSpeed * BALL_SPEED_Y_RATIO;
		
		// Random vertical component for variety
		const randomY = (Math.random() - 0.5) * 2; // -1 to 1
		
		state.ballSpeedX = direction * speedX;
		state.ballSpeedY = randomY * speedY;
	}, []);

	// Game loop
	useEffect(() => {
		const gameLoop = () => {
			try {
				const state = gameStateRef.current;
				const demoMode = !gameStarted && !gameOver;

				// Demo mode - AI plays both sides
				if (demoMode) {
					const leftPaddleCenter = state.leftPaddleY + PADDLE_HEIGHT / 2;
					const ballCenter = state.ballY + BALL_SIZE / 2;
					if (ballCenter < leftPaddleCenter - 10) {
						state.leftPaddleY = Math.max(0, state.leftPaddleY - PADDLE_BASE_SPEED * 0.7);
					} else if (ballCenter > leftPaddleCenter + 10) {
						state.leftPaddleY = Math.min(
							CANVAS_HEIGHT - PADDLE_HEIGHT,
							state.leftPaddleY + PADDLE_BASE_SPEED * 0.7
						);
					}

					const rightPaddleCenter = state.rightPaddleY + PADDLE_HEIGHT / 2;
					if (ballCenter < rightPaddleCenter - 10) {
						state.rightPaddleY = Math.max(0, state.rightPaddleY - PADDLE_BASE_SPEED * 0.7);
					} else if (ballCenter > rightPaddleCenter + 10) {
						state.rightPaddleY = Math.min(
							CANVAS_HEIGHT - PADDLE_HEIGHT,
							state.rightPaddleY + PADDLE_BASE_SPEED * 0.7
						);
					}

					state.ballX += state.ballSpeedX;
					state.ballY += state.ballSpeedY;

					if (state.ballY <= 0 || state.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
						state.ballSpeedY = -state.ballSpeedY;
					}

					if (
						state.ballX <= PADDLE_WIDTH + 20 &&
						state.ballY + BALL_SIZE >= state.leftPaddleY &&
						state.ballY <= state.leftPaddleY + PADDLE_HEIGHT
					) {
						state.ballSpeedX = Math.abs(state.ballSpeedX);
						const hitPos = (state.ballY - state.leftPaddleY) / PADDLE_HEIGHT - 0.5;
						state.ballSpeedY = hitPos * 8;
					}

					if (
						state.ballX + BALL_SIZE >= CANVAS_WIDTH - PADDLE_WIDTH - 20 &&
						state.ballY + BALL_SIZE >= state.rightPaddleY &&
						state.ballY <= state.rightPaddleY + PADDLE_HEIGHT
					) {
						state.ballSpeedX = -Math.abs(state.ballSpeedX);
						const hitPos = (state.ballY - state.rightPaddleY) / PADDLE_HEIGHT - 0.5;
						state.ballSpeedY = hitPos * 8;
					}

					if (state.ballX < 0 || state.ballX > CANVAS_WIDTH) {
						state.ballX = CANVAS_WIDTH / 2;
						state.ballY = CANVAS_HEIGHT / 2;
						// Random direction for demo mode
						const direction = Math.random() < 0.5 ? -1 : 1;
						state.ballSpeedX = direction * BALL_SPEED_BASE;
						state.ballSpeedY = (Math.random() - 0.5) * BALL_SPEED_BASE * BALL_SPEED_Y_RATIO * 2;
					}

					drawGame();
					animationIdRef.current = requestAnimationFrame(gameLoop);
					return;
				}

				if (gameOver) {
					drawGame();
					animationIdRef.current = requestAnimationFrame(gameLoop);
					return;
				}

				if (gameStarted) {
					// Gradually increase ball speed over time
					if (gameStartTimeRef.current) {
						const now = Date.now();
						if (now - lastBallSpeedIncreaseRef.current >= BALL_SPEED_INCREASE_INTERVAL) {
							// Increase speed multiplier
							const maxMultiplier = BALL_SPEED_MAX / BALL_SPEED_BASE;
							if (state.ballSpeedMultiplier < maxMultiplier) {
								state.ballSpeedMultiplier = Math.min(
									state.ballSpeedMultiplier + BALL_SPEED_INCREASE_RATE,
									maxMultiplier
								);
								
								// Update ball speed while maintaining direction
								const currentSpeed = Math.min(BALL_SPEED_BASE * state.ballSpeedMultiplier, BALL_SPEED_MAX);
								const directionX = state.ballSpeedX > 0 ? 1 : -1;
								const directionY = state.ballSpeedY > 0 ? 1 : -1;
								const speedY = Math.abs(state.ballSpeedY) / Math.abs(state.ballSpeedX) * currentSpeed;
								
								state.ballSpeedX = directionX * currentSpeed;
								state.ballSpeedY = directionY * Math.min(speedY, currentSpeed * BALL_SPEED_Y_RATIO);
							}
							lastBallSpeedIncreaseRef.current = now;
						}
					}

					// Left paddle with velocity-based acceleration
					let leftPaddleDirection = 0;
					if (state.keys['w'] || state.keys['W']) {
						leftPaddleDirection = -1;
					} else if (state.keys['s'] || state.keys['S']) {
						leftPaddleDirection = 1;
					}
					
					if (leftPaddleDirection !== 0) {
						// Accelerate with immediate boost for quick taps
						state.leftPaddleVelocity += leftPaddleDirection * PADDLE_ACCELERATION;
						// Ensure minimum velocity for responsiveness on quick taps
						if (leftPaddleDirection < 0 && state.leftPaddleVelocity > -PADDLE_MIN_VELOCITY) {
							state.leftPaddleVelocity = -PADDLE_MIN_VELOCITY;
						} else if (leftPaddleDirection > 0 && state.leftPaddleVelocity < PADDLE_MIN_VELOCITY) {
							state.leftPaddleVelocity = PADDLE_MIN_VELOCITY;
						}
						state.leftPaddleVelocity = Math.max(-PADDLE_MAX_SPEED, Math.min(PADDLE_MAX_SPEED, state.leftPaddleVelocity));
					} else {
						// Decelerate
						if (state.leftPaddleVelocity > 0) {
							state.leftPaddleVelocity = Math.max(0, state.leftPaddleVelocity - PADDLE_DECELERATION);
						} else if (state.leftPaddleVelocity < 0) {
							state.leftPaddleVelocity = Math.min(0, state.leftPaddleVelocity + PADDLE_DECELERATION);
						}
					}
					
					state.leftPaddleY += state.leftPaddleVelocity;
					state.leftPaddleY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.leftPaddleY));

					// Right paddle
					if (gameMode === '1v1') {
						// Player 2 controls with velocity-based acceleration
						let rightPaddleDirection = 0;
						if (state.keys['o'] || state.keys['O']) {
							rightPaddleDirection = -1;
						} else if (state.keys['k'] || state.keys['K']) {
							rightPaddleDirection = 1;
						}
						
						if (rightPaddleDirection !== 0) {
							// Accelerate with immediate boost for quick taps
							state.rightPaddleVelocity += rightPaddleDirection * PADDLE_ACCELERATION;
							// Ensure minimum velocity for responsiveness on quick taps
							if (rightPaddleDirection < 0 && state.rightPaddleVelocity > -PADDLE_MIN_VELOCITY) {
								state.rightPaddleVelocity = -PADDLE_MIN_VELOCITY;
							} else if (rightPaddleDirection > 0 && state.rightPaddleVelocity < PADDLE_MIN_VELOCITY) {
								state.rightPaddleVelocity = PADDLE_MIN_VELOCITY;
							}
							state.rightPaddleVelocity = Math.max(-PADDLE_MAX_SPEED, Math.min(PADDLE_MAX_SPEED, state.rightPaddleVelocity));
						} else {
							// Decelerate
							if (state.rightPaddleVelocity > 0) {
								state.rightPaddleVelocity = Math.max(0, state.rightPaddleVelocity - PADDLE_DECELERATION);
							} else if (state.rightPaddleVelocity < 0) {
								state.rightPaddleVelocity = Math.min(0, state.rightPaddleVelocity + PADDLE_DECELERATION);
							}
						}
						
						state.rightPaddleY += state.rightPaddleVelocity;
						state.rightPaddleY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.rightPaddleY));
					} else if (gameMode === '1vAI') {
						// AI controls (keep simple movement for AI)
						const paddleCenter = state.rightPaddleY + PADDLE_HEIGHT / 2;
						const ballCenter = state.ballY + BALL_SIZE / 2;
						if (ballCenter < paddleCenter - 10) {
							state.rightPaddleY = Math.max(0, state.rightPaddleY - PADDLE_BASE_SPEED * 0.7);
						} else if (ballCenter > paddleCenter + 10) {
							state.rightPaddleY = Math.min(
								CANVAS_HEIGHT - PADDLE_HEIGHT,
								state.rightPaddleY + PADDLE_BASE_SPEED * 0.7
							);
						}
					}

					// Move ball
					state.ballX += state.ballSpeedX;
					state.ballY += state.ballSpeedY;

					// Ball collision with top/bottom
					if (state.ballY <= 0 || state.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
						state.ballSpeedY = -state.ballSpeedY;
					}

					// Ball collision with left paddle
					if (
						state.ballX <= PADDLE_WIDTH + 20 &&
						state.ballY + BALL_SIZE >= state.leftPaddleY &&
						state.ballY <= state.leftPaddleY + PADDLE_HEIGHT
					) {
						const currentSpeed = Math.min(BALL_SPEED_BASE * state.ballSpeedMultiplier, BALL_SPEED_MAX);
						state.ballSpeedX = currentSpeed;
						const hitPos = (state.ballY - state.leftPaddleY) / PADDLE_HEIGHT - 0.5;
						state.ballSpeedY = hitPos * currentSpeed * 3.2; // Scale hit speed with current speed
					}

					// Ball collision with right paddle
					if (
						state.ballX + BALL_SIZE >= CANVAS_WIDTH - PADDLE_WIDTH - 20 &&
						state.ballY + BALL_SIZE >= state.rightPaddleY &&
						state.ballY <= state.rightPaddleY + PADDLE_HEIGHT
					) {
						const currentSpeed = Math.min(BALL_SPEED_BASE * state.ballSpeedMultiplier, BALL_SPEED_MAX);
						state.ballSpeedX = -currentSpeed;
						const hitPos = (state.ballY - state.rightPaddleY) / PADDLE_HEIGHT - 0.5;
						state.ballSpeedY = hitPos * currentSpeed * 3.2; // Scale hit speed with current speed
					}

					// Ball out of bounds - scoring
					if (state.ballX < 0) {
						rightScoreRef.current += 1;
						const newScore = rightScoreRef.current;
						setRightScore(newScore);
						if (newScore === 3) {
							setGameOver(true);
							const winnerName = gameMode === '1v1' ? player2Name : 'AI';
							setWinner(winnerName);
							recordWinOnBlockchain('right', `${leftScoreRef.current}-${newScore}`);
						} else {
							// Launch ball with random direction (not first launch)
							launchBall(false);
						}
					} else if (state.ballX > CANVAS_WIDTH) {
						leftScoreRef.current += 1;
						const newScore = leftScoreRef.current;
						setLeftScore(newScore);
						if (newScore === 3) {
							setGameOver(true);
							setWinner(player1Name);
							recordWinOnBlockchain('left', `${newScore}-${rightScoreRef.current}`);
						} else {
							// Launch ball with random direction (not first launch)
							launchBall(false);
						}
					}
				}

				drawGame();
				animationIdRef.current = requestAnimationFrame(gameLoop);
			} catch (error) {
				console.error('Error in game loop:', error);
				animationIdRef.current = requestAnimationFrame(gameLoop);
			}
		};

		animationIdRef.current = requestAnimationFrame(gameLoop);

		return () => {
			if (animationIdRef.current !== null) {
				cancelAnimationFrame(animationIdRef.current);
			}
		};
	}, [gameStarted, gameOver, gameMode, player1Name, player2Name, leftScore, rightScore, drawGame, recordWinOnBlockchain, launchBall]);

	// Handlers
	const handlePlayClick = () => {
		setShowModeSelection(true);
	};

	const handleModeSelect = (mode: '1v1' | '1vAI') => {
		setGameMode(mode);
		setShowModeSelection(false);
		setShowNameInput(true);
		// Load saved player names from localStorage
		if (mode === '1vAI') {
			const savedName = localStorage.getItem('pong-player1-name');
			if (savedName) {
				// Strip spaces in case old saved value had them
				const stripped = savedName.replace(/\s/g, '');
				setPlayer1Name(stripped);
			}
		} else if (mode === '1v1') {
			const savedPlayer1 = localStorage.getItem('pong-player1-name');
			const savedPlayer2 = localStorage.getItem('pong-player2-name');
			if (savedPlayer1) {
				const stripped = savedPlayer1.replace(/\s/g, '');
				setPlayer1Name(stripped);
			}
			if (savedPlayer2) {
				const stripped = savedPlayer2.replace(/\s/g, '');
				setPlayer2Name(stripped);
			}
		}
	};

	// Handle countdown timer
	useEffect(() => {
		if (startDelay === null) return;

		if (startDelay > 0) {
			const timer = setTimeout(() => {
				setStartDelay(startDelay - 1);
			}, 1000);
			return () => clearTimeout(timer);
		} else if (startDelay === 0) {
			// Start the game after countdown completes
			// Hide name input if it's showing (for new game start)
			if (showNameInput) {
				setShowNameInput(false);
			}
			// Reset game state and start game
			setGameStarted(true);
			gameStartTimeRef.current = Date.now();
			leftScoreRef.current = 0;
			rightScoreRef.current = 0;
			setLeftScore(0);
			setRightScore(0);
			setGameOver(false);
			setWinner(null);
			gameStateRef.current.leftPaddleY = CENTERED_PADDLE_Y;
			gameStateRef.current.rightPaddleY = CENTERED_PADDLE_Y;
			gameStateRef.current.leftPaddleVelocity = 0;
			gameStateRef.current.rightPaddleVelocity = 0;
			gameStateRef.current.ballSpeedMultiplier = 1;
			// Launch ball with base speed for first launch
			isFirstLaunchRef.current = true;
			launchBall(true);
			isFirstLaunchRef.current = false; // Mark as used
			setStartDelay(null);
		}
	}, [startDelay, showNameInput, launchBall]);

	// Validate names whenever they change - only check for duplicate names during input
	useEffect(() => {
		// Only show error if names are the same (duplicate names)
		// Don't show other validation errors until START GAME is pressed
		if (gameMode === '1v1' && player1Name.trim() && player2Name.trim()) {
			if (player1Name.toLowerCase() === player2Name.toLowerCase()) {
				setPlayer1Error('Names must be different');
				setPlayer2Error('Names must be different');
			} else {
				setPlayer1Error(null);
				setPlayer2Error(null);
			}
		} else {
			// Clear errors if not in 1v1 mode or if one of the names is empty
			setPlayer1Error(null);
			setPlayer2Error(null);
		}
	}, [player1Name, player2Name, gameMode]);

	// Handle player name changes - strip spaces
	const handlePlayer1NameChange = (value: string) => {
		const stripped = value.replace(/\s/g, '');
		setPlayer1Name(stripped);
	};

	const handlePlayer2NameChange = (value: string) => {
		const stripped = value.replace(/\s/g, '');
		setPlayer2Name(stripped);
	};

	// Check if names are valid
	const isValid = !player1Error && !player2Error && player1Name.length >= 3 && (gameMode === '1vAI' || player2Name.length >= 3);

	const handleStartGameWithNames = () => {
		// Force full validation check (including length, spaces, etc.)
		const validation = validateNames(player1Name, player2Name, gameMode);
		setPlayer1Error(validation.player1Error);
		setPlayer2Error(validation.player2Error);
		
		// Check if valid after forcing validation
		const isValidNow = !validation.player1Error && !validation.player2Error && player1Name.length >= 3 && (gameMode === '1vAI' || player2Name.length >= 3);
		if (!isValidNow) {
			return;
		}

		// Save player names to localStorage only when START GAME is pressed
		if (gameMode === '1vAI' && player1Name.trim()) {
			localStorage.setItem('pong-player1-name', player1Name.trim());
		} else if (gameMode === '1v1') {
			if (player1Name.trim()) {
				localStorage.setItem('pong-player1-name', player1Name.trim());
			}
			if (player2Name.trim()) {
				localStorage.setItem('pong-player2-name', player2Name.trim());
			}
		}

		// Start 3-second countdown
		setStartDelay(3);
	};

	const handleResetGame = () => {
		// Start 3-second countdown
		setStartDelay(3);
	};

	const handleBackToStart = () => {
		leftScoreRef.current = 0;
		rightScoreRef.current = 0;
		setLeftScore(0);
		setRightScore(0);
		setGameOver(false);
		setWinner(null);
		setGameStarted(false);
		setShowModeSelection(false);
		setShowNameInput(false);
		setGameMode(null);
		setPlayer1Name('');
		setPlayer2Name('');
		setPlayer1Error(null);
		setPlayer2Error(null);
		setStartDelay(null);
		gameStateRef.current.ballX = 210;
		gameStateRef.current.ballY = 150;
		// Random direction for demo mode
		const direction = Math.random() < 0.5 ? -1 : 1;
		gameStateRef.current.ballSpeedX = direction * BALL_SPEED_BASE;
		gameStateRef.current.ballSpeedY = (Math.random() - 0.5) * BALL_SPEED_BASE * BALL_SPEED_Y_RATIO * 2;
		gameStateRef.current.ballSpeedMultiplier = 1;
		gameStateRef.current.leftPaddleY = CENTERED_PADDLE_Y;
		gameStateRef.current.rightPaddleY = CENTERED_PADDLE_Y;
		gameStateRef.current.leftPaddleVelocity = 0;
		gameStateRef.current.rightPaddleVelocity = 0;
		isFirstLaunchRef.current = true;
	};

	const handleBackFromModeSelection = () => {
		setShowModeSelection(false);
	};

	const handleBackFromNameInput = () => {
		setShowNameInput(false);
		setShowModeSelection(true);
		setPlayer1Name('');
		setPlayer2Name('');
		setPlayer1Error(null);
		setPlayer2Error(null);
		setStartDelay(null);
	};

	return (
		<div className="backdrop-blur-[50px] backdrop-filter bg-[rgba(81,81,81,0.24)] relative rounded-[48px] aspect-[1/1] w-full">
			<div className="absolute border-[0.5px] border-[rgba(226,226,226,0.2)] border-solid inset-0 pointer-events-none rounded-[48px]"></div>

			<div className="flex flex-col items-center size-full">
				<div className="box-border flex flex-col items-center px-[32px] py-[20px] relative w-full h-full">
					{/* Header */}
					<div className="h-10 flex items-center justify-center relative w-full shrink-0">
						<p className="font-mono font-normal text-[11px] text-[rgba(0,255,0,0.6)] text-center text-nowrap tracking-[0.2px] uppercase">
							First to 3 wins • Recorded on blockchain
						</p>
					</div>

					{/* Main content */}
					<div className="flex-1 flex items-center justify-center w-full min-h-0">
						<div className="aspect-[4/3] overflow-clip relative shrink-0 w-full">
							<ScoreDisplay
								leftScore={leftScore}
								rightScore={rightScore}
								player1Name={player1Name}
								player2Name={player2Name}
								gameMode={gameMode}
								visible={gameStarted || gameOver}
							/>

							<canvas
								ref={canvasRef}
								className="absolute inset-0 w-full h-full"
							/>
						</div>
					</div>

					{/* Footer */}
					<div className="h-10 flex items-center justify-center opacity-40 relative w-full shrink-0">
						<p className="font-mono font-normal leading-[18px] relative shrink-0 text-[11px] text-center text-nowrap tracking-[0.2px] uppercase whitespace-pre">
							W/S - Left Paddle | O/K - Right Paddle
						</p>
					</div>
				</div>
			</div>

			{/* Overlays */}
			{!gameStarted && !showModeSelection && !showNameInput && (
				<StartScreenOverlay onPlayClick={handlePlayClick} />
			)}

			{showModeSelection && (
				<ModeSelectionOverlay
					onModeSelect={handleModeSelect}
					onBack={handleBackFromModeSelection}
				/>
			)}

			{showNameInput && (
				<NameInputOverlay
					gameMode={gameMode}
					player1Name={player1Name}
					player2Name={player2Name}
					onPlayer1NameChange={handlePlayer1NameChange}
					onPlayer2NameChange={handlePlayer2NameChange}
					onStart={handleStartGameWithNames}
					onBack={handleBackFromNameInput}
					startDelay={startDelay}
					player1Error={player1Error}
					player2Error={player2Error}
					isValid={isValid}
				/>
			)}

			{gameOver && winner && (
				<GameOverOverlay
					winner={winner}
					onBack={handleBackToStart}
					onPlayAgain={handleResetGame}
					startDelay={startDelay}
				/>
			)}

			{/* {showTxNotification && lastTxHash && (
				<TransactionNotification txHash={lastTxHash} />
			)} */}
		</div>
	);
}
