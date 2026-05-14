# Birdeye Token Radar

A small Sprint 4 submission for the Birdeye Data BIP competition.

The app turns Birdeye Data into a contributor-friendly Solana token research dashboard. It pulls trending tokens, enriches them with market and trade data, and computes a simple risk-adjusted opportunity score based on liquidity, volume, wallet activity, trades, and volatility.

## Why this is useful

Token discovery is noisy. A beginner can see what is trending, but it is harder to separate tokens with real market depth from tokens that are only moving because of short-lived volatility. This radar gives contributors a quick first pass before they do deeper research.

This is not financial advice and does not execute trades. It is a research UI only.

## Birdeye Data endpoints used

- `/defi/token_trending`
- `/defi/v3/token/market-data`
- `/defi/v3/token/trade-data/single`

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Add your Birdeye Data API key to `.env`:

```bash
BIRDEYE_API_KEY=your_key_here
```

If no API key is present, the app runs in demo mode with sample Solana token data so the interface and scoring logic can still be reviewed.

## Scoring model

The score is intentionally transparent:

- liquidity depth reduces thin-market risk
- 24h volume shows active market interest
- unique wallet activity points to broader participation
- trade count reflects current usage
- extreme 24h volatility applies a penalty

## Submission note

This project is designed as a 1-3 hour MVP: small scope, clear endpoint usage, readable code, and a polished frontend that can be extended with alerts, watchlists, or wallet-level research later.
