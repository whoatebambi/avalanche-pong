'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import PlayablePongGame from '@/components/PlayablePongGame';
import Transactions from '@/components/Transactions';
import TechStack from '@/components/TechStack';
import ShaderBackgroundWrapper from '@/components/ShaderBackgroundWrapper';
import { type DebugState } from '@/components/DebugHelper';

export default function Home() {
	const [debugState, setDebugState] = useState<DebugState>('data');
	const [isDebugMode, setIsDebugMode] = useState(false);

	return (
		<div className="min-h-screen w-full relative overflow-auto">
			<ShaderBackgroundWrapper />

			<div className="relative z-10 min-h-screen flex flex-col gap-4 safe-area-padding md:px-8 md:py-8">
				<div className="w-full flex justify-center relative z-20 overflow-visible">
					<Header 
						debugState={debugState}
						onDebugStateChange={setDebugState}
						onDebugModeChange={setIsDebugMode}
						githubUrl="https://github.com/whoatebambi/avalanche-pong"
						portfolioUrl="https://florencecousergue.com"
					/>
				</div>

				<div className="flex flex-col md:flex-row md:items-stretch gap-4 justify-center items-start w-full max-w-[520px] md:max-w-[1080px] mx-auto relative z-0">
					<div className="w-full md:flex-1 md:min-w-0 shrink-0 md:h-full flex">
						<PlayablePongGame />
					</div>

					<div className="w-full md:flex-1 md:min-w-0 shrink-0 md:h-full flex">
						<Transactions debugState={debugState} isDebugMode={isDebugMode} />
					</div>
				</div>

				<div className="w-full max-w-[520px] md:max-w-[1080px] mx-auto relative z-0">
					<TechStack />
				</div>
			</div>
		</div>
	);
}
