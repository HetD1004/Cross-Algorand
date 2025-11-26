# Cross-Check

A modern decentralized governance platform built with React and Algorand blockchain. Cross-Check enables users to create, vote on, and track proposals on Algorand TestNet in a transparent and decentralized manner.

##  Features

- **Decentralized Governance**: Create and manage proposals on the blockchain
- **Web3 Integration**: Seamless wallet connection and blockchain interaction
- **Proposal Management**: Create, view, and vote on community proposals
- **Real-time Status**: Track proposal statuses (upcoming, active, completed)
- **Profile Management**: Manage your Web3 identity and voting history
- **Responsive Design**: Beautiful UI that works across all devices

##  Tech Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with custom theme configuration
- **Algorand Integration**: 
  - `algosdk`
  - `@perawallet/connect`
- **UI Components**: 
  - Radix UI primitives
  - Custom reusable components
- **Routing**: React Router v6
- **Code Quality**: ESLint, TypeScript

##  Getting Started

1. **Clone the repository**

```bash
git clone <repository-url>
cd Cross-Check-Web
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm run dev
```

4. **Build for production**

```bash
npm run build
```

##  Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint checks

##  Project Structure

```
src/
├── blockchain/       # Web3 and blockchain integration
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── ...          # Feature-specific components
├── providers/        # React context providers
└── ...              # Root files
```

##  UI Components

The project uses a combination of Radix UI primitives and custom components styled with TailwindCSS. The design system includes:

- Custom color scheme with primary and status colors
- Consistent border radius and shadow styles
- Responsive design patterns
- Dark mode support

##  Algorand Integration

The platform integrates with Algorand TestNet through:
- Pera Wallet for wallet connections
- Algorand SDK for blockchain interactions
- Custom governance smart contract integration

##  License

MIT

##  Contributing

Contributions, issues, and feature requests are welcome!
