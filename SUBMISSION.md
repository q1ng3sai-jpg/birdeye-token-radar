# Superteam Earn Submission Draft

## Project title

Birdeye Token Radar: Solana Token Opportunity Dashboard

## Brief description

I built a lightweight Solana token research dashboard using Birdeye Data. The app pulls trending token discovery data, enriches each token with market and trade metrics, and computes a transparent risk-adjusted opportunity score based on liquidity, 24h volume, trade activity, unique wallet activity, and volatility.

The goal is to help contributors quickly identify which trending Solana tokens deserve deeper research without turning the product into a trading bot or execution tool. It is a read-only research dashboard and does not connect to wallets, sign transactions, or provide financial advice.

## Birdeye Data endpoints used

- `/defi/token_trending`
- `/defi/v3/token/market-data`
- `/defi/v3/token/trade-data/single`

## What I built

- React + TypeScript frontend
- Node/Express API proxy for Birdeye requests
- Demo mode when no API key is present
- Token scorecard with price, liquidity, volume, trades, wallet activity, and 24h change
- Transparent scoring explanation so users understand why a token ranks higher

## Why it is useful

Token discovery can be noisy, especially when trending lists are driven by short-term volatility. This dashboard gives users a cleaner first-pass research workflow by combining discovery, liquidity, activity, and volatility into one view. The MVP is intentionally simple but can be extended into alerts, watchlists, wallet-level research, or AI-assisted token summaries.

## Safety note

This project is read-only. It does not request private keys, connect wallets, download executables, execute swaps, or encourage trading. It is designed as a research and analytics tool only.
