import Image, { type StaticImageData } from 'next/image';
import nextjsLogo from '@/assets/nextjs.svg';
import reactLogo from '@/assets/react.svg';
import typescriptLogo from '@/assets/typescript.svg';
import tailwindLogo from '@/assets/tailwindcss.svg';
import avalancheLogo from '@/assets/avalanche.svg';
import web3Logo from '@/assets/web3.svg';

interface TechBlock {
	name: string;
	description: string;
	category: string;
	logo?: string | StaticImageData;
}

const techStack: TechBlock[] = [
	{
		name: 'Next.js',
		description: 'Full-stack React framework.',
		category: 'Framework',
		logo: nextjsLogo,
	},
	{
		name: 'React',
		description: 'Component-based JavaScript library.',
		category: 'Library',
		logo: reactLogo,
	},
	{
		name: 'TypeScript',
		description: 'Type-safe JavaScript extension.',
		category: 'Language',
		logo: typescriptLogo,
	},
	{
		name: 'Tailwind CSS',
		description: 'Utility-first CSS framework for rapid styling.',
		category: 'Styling',
		logo: tailwindLogo,
	},
	{
		name: 'Avalanche',
		description: 'High-performance blockchain network for decentralized apps.',
		category: 'Blockchain',
		logo: avalancheLogo,
	},
	{
		name: 'Web3',
		description: 'Decentralized web protocols for blockchain integration.',
		category: 'Protocol',
		logo: web3Logo,
	},
];

function TechBlockCard({ tech }: { tech: TechBlock }) {
	return (
		<div className="backdrop-blur-[50px] bg-[rgba(81,81,81,0.24)] border border-[rgba(226,226,226,0.2)] rounded-[24px] p-6 flex flex-col gap-2">
			{tech.logo && (
				<div className="relative w-28 h-12">
					{typeof tech.logo === 'string' ? (
						<img
							src={tech.logo}
							alt={`${tech.name} logo`}
							className="w-full h-full object-contain"
						/>
					) : (
						<Image
							src={tech.logo}
							alt={`${tech.name} logo`}
							fill
							className="object-contain"
						/>
					)}
				</div>
			)}
			<div className="flex flex-col gap-1">
				<p className="font-mono text-[12px] opacity-60">
					{tech.description}
				</p>
			</div>
			<div className="mt-auto">
				<span className="font-mono text-[11px] opacity-40 uppercase tracking-[0.2px]">
					{tech.category}
				</span>
			</div>
		</div>
	);
}

export default function TechStack() {
	return (
		<div className="w-full max-w-[520px] md:max-w-[1080px] mx-auto px-4 md:px-0">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{techStack.map((tech, index) => (
					<TechBlockCard key={index} tech={tech} />
				))}
			</div>
		</div>
	);
}

