# Anime Battle Arena

On-chain anime character battle arena on Ritual Chain (testnet).

## Structure

```
Ritual-Anime-Battle/
├── contracts/          # Hardhat + Solidity
│   ├── src/            # Contracts
│   ├── test/           # Tests (7/7 passing)
│   └── scripts/        # Deploy script
├── frontend/           # Next.js + wagmi
│   ├── app/            # Pages
│   ├── components/     # UI components
│   └── lib/            # Config + providers
└── README.md
```

## Deploy (Ritual testnet)

1. Copy `.env.example` to `.env`, add your private key
2. Get RITUAL from faucet: https://faucet.ritualfoundation.org
3. Run: `cd contracts && npx hardhat run scripts/deploy.js --network ritual`
4. Update `CONTRACT_ADDRESS` in `frontend/lib/config.js`

## Run Frontend

```bash
cd frontend
npm run dev
```

## Run Tests

```bash
cd contracts
npx hardhat test
```
