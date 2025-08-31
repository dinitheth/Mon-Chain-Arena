# **App Name**: Chain Arena: On-Chain Battles

## Core Features:

- Monad Games ID Login: Authenticate users using Privy with Monad Games ID for seamless login to the arena.
- On-Chain Victory Recording: Record player victories, including player address, name, kills, and deaths, immutably on the Monad blockchain via a smart contract.
- Dynamic Arena Battles: Engage in arena battles with bot opponents that increase in difficulty over 3 rounds. The React-based game loop manages movement, combat, and AI behavior.
- On-Chain Leaderboard: Fetch and display an on-chain leaderboard, showcasing player rankings based on their performance recorded on the smart contract.
- Persistent Player Identity: Associate player names permanently with their wallet addresses on the smart contract, creating a persistent player identity.
- AI Bot Opponent Tool: Generative AI provides bots which dynamically adjust their strategies each round.
- UI/UX Enhancements: Implement smooth UI transitions using Framer Motion, and enable light/dark mode toggling using ShadCN switch components, ensuring a seamless and visually appealing user experience.

## Style Guidelines:

- Primary color: Deep purple (#4B0082) for a modern and immersive feel.
- Background color: Dark gray (#282828) for dark mode, and soft white (#FAFAFA) for light mode.
- Accent color: Neon green (#39FF14) to highlight interactive elements and calls to action.
- Body text and headlines: 'Inter' (sans-serif) for a modern, machined feel; good for UI elements
- Code font: 'Source Code Pro' (monospace) for displaying code snippets and smart contract addresses.
- Use icons from Lucide to clearly indicate arena action effects
- Responsive design with Tailwind CSS to ensure seamless experience on desktop and mobile devices.
- Framer Motion to animate player movement and action effects with duration 0.2s and easeInOut curves.