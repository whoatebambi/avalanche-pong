import Header from '@/components/Header';
import PlayablePongGame from '@/components/PlayablePongGame';
import Transactions from '@/components/Transactions';
import TechStack from '@/components/TechStack';
import ShaderBackgroundWrapper from '@/components/ShaderBackgroundWrapper';

export default function Home() {
	return (
		<div className="min-h-screen w-full relative overflow-auto">
			<ShaderBackgroundWrapper />

			<div className="relative z-10 min-h-screen flex flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
				{/* Header */}
				<div className="w-full flex justify-center relative z-20">
					<Header />
				</div>

				{/* Main content: Game and Transactions */}
				{/* Below md: stacked vertically, At md and above: side by side horizontally */}
				<div className="flex-1 flex flex-col md:flex-row md:items-stretch gap-4 justify-center items-start w-full max-w-[520px] md:max-w-[1080px] mx-auto relative z-0">
					{/* Game Component - maintains aspect ratio 176/132 internally */}
					<div className="w-full md:flex-1 md:min-w-0 shrink-0 md:h-full flex">
						<PlayablePongGame />
					</div>

					{/* Transactions Component - matches height of Pong component above md */}
					<div className="w-full md:flex-1 md:min-w-0 shrink-0 md:h-full flex">
						<Transactions />
					</div>
				</div>

				{/* Tech Stack Section */}
				<div className="w-full max-w-[520px] md:max-w-[1080px] mx-auto relative z-0">
					<TechStack />
				</div>
			</div>
		</div>
	);
}
