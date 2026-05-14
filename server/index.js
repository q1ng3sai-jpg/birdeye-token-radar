import "dotenv/config";
import express from "express";

const app = express();
const port = Number(process.env.PORT || 8787);
const birdeyeBaseUrl = "https://public-api.birdeye.so";
let lastLiveRadar = null;

const mockTokens = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    price: 143.27,
    liquidity: 93000000,
    volume24h: 720000000,
    priceChange24h: 4.8,
    trade24h: 392000,
    uniqueWallet24h: 114000,
  },
  {
    address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    symbol: "JUP",
    name: "Jupiter",
    price: 0.82,
    liquidity: 25800000,
    volume24h: 91000000,
    priceChange24h: -1.6,
    trade24h: 87000,
    uniqueWallet24h: 29000,
  },
  {
    address: "DezXAZ8z7PnrnRJjz3z7Y21WrGwY8KxUq4kPDaJToPj",
    symbol: "BONK",
    name: "Bonk",
    price: 0.000019,
    liquidity: 18100000,
    volume24h: 56000000,
    priceChange24h: 9.1,
    trade24h: 152000,
    uniqueWallet24h: 47000,
  },
  {
    address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzL5vC2wZq8Z4",
    symbol: "WIF",
    name: "dogwifhat",
    price: 1.67,
    liquidity: 14700000,
    volume24h: 86000000,
    priceChange24h: 12.4,
    trade24h: 73000,
    uniqueWallet24h: 19000,
  },
];

function normalizeToken(raw) {
  const item = raw?.address ? raw : raw?.token || raw?.tokenInfo || raw;
  return {
    address: item?.address || item?.mint || item?.tokenAddress || "",
    symbol: item?.symbol || item?.tokenSymbol || "UNKNOWN",
    name: item?.name || item?.tokenName || item?.symbol || "Unknown token",
    price: Number(item?.price || item?.value || 0),
    liquidity: Number(item?.liquidity || item?.liquidityUsd || item?.liquidity_usd || 0),
    volume24h: Number(item?.volume24hUSD || item?.volume24h || item?.v24hUSD || item?.volume24hUsd || 0),
    priceChange24h: Number(item?.priceChange24hPercent || item?.priceChange24h || item?.price_change_24h || 0),
    trade24h: Number(item?.trade24h || item?.txns24h || item?.trade_24h || 0),
    uniqueWallet24h: Number(item?.uniqueWallet24h || item?.unique_wallet_24h || item?.holder || 0),
  };
}

function scoreToken(token) {
  const liquidityScore = Math.min(token.liquidity / 10_000_000, 1) * 30;
  const volumeScore = Math.min(token.volume24h / 75_000_000, 1) * 25;
  const walletScore = Math.min(token.uniqueWallet24h / 40_000, 1) * 20;
  const volatilityPenalty = Math.min(Math.abs(token.priceChange24h) / 25, 1) * 15;
  const tradeScore = Math.min(token.trade24h / 100_000, 1) * 10;
  const score = Math.round(liquidityScore + volumeScore + walletScore + tradeScore - volatilityPenalty + 30);
  return Math.max(0, Math.min(score, 100));
}

async function birdeye(path, params = {}) {
  if (!process.env.BIRDEYE_API_KEY) {
    throw new Error("Missing BIRDEYE_API_KEY");
  }

  const url = new URL(path, birdeyeBaseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "X-API-KEY": process.env.BIRDEYE_API_KEY,
      "x-chain": "solana",
    },
  });

  if (!response.ok) {
    throw new Error(`Birdeye request failed: ${response.status}`);
  }

  return response.json();
}

app.get("/api/radar", async (_req, res) => {
  try {
    const trending = await birdeye("/defi/token_trending", {
      sort_by: "rank",
      sort_type: "asc",
      offset: 0,
      limit: 12,
    });

    const rows = (trending?.data?.tokens || trending?.data?.items || trending?.data || [])
      .slice(0, 12)
      .map(normalizeToken)
      .filter((token) => token.address);

    const enriched = await Promise.all(
      rows.slice(0, 8).map(async (token) => {
        try {
          const [marketData, tradeData] = await Promise.all([
            birdeye("/defi/v3/token/market-data", { address: token.address }),
            birdeye("/defi/v3/token/trade-data/single", { address: token.address }),
          ]);

          return normalizeToken({
            ...token,
            ...(marketData?.data || {}),
            ...(tradeData?.data || {}),
          });
        } catch {
          return token;
        }
      }),
    );

    const payload = {
      mode: "live",
      generatedAt: new Date().toISOString(),
      endpoints: [
        "/defi/token_trending",
        "/defi/v3/token/market-data",
        "/defi/v3/token/trade-data/single",
      ],
      tokens: enriched.map((token) => ({ ...token, score: scoreToken(token) })),
    };

    lastLiveRadar = payload;
    res.json(payload);
  } catch (error) {
    if (process.env.BIRDEYE_API_KEY && lastLiveRadar) {
      res.json({
        ...lastLiveRadar,
        generatedAt: new Date().toISOString(),
        warning: `Using cached live data because the latest Birdeye request failed: ${error.message}`,
      });
      return;
    }

    res.json({
      mode: "demo",
      generatedAt: new Date().toISOString(),
      warning: error.message,
      endpoints: [
        "/defi/token_trending",
        "/defi/v3/token/market-data",
        "/defi/v3/token/trade-data/single",
      ],
      tokens: mockTokens.map((token) => ({ ...token, score: scoreToken(token) })),
    });
  }
});

app.listen(port, () => {
  console.log(`Birdeye radar API running on http://127.0.0.1:${port}`);
});
