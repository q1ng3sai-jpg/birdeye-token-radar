import React from "react";
import ReactDOM from "react-dom/client";
import { Activity, BarChart3, RefreshCcw, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import "./styles.css";

type RadarToken = {
  address: string;
  symbol: string;
  name: string;
  price: number;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  trade24h: number;
  uniqueWallet24h: number;
  score: number;
};

type RadarResponse = {
  mode: "live" | "demo";
  generatedAt: string;
  warning?: string;
  endpoints: string[];
  tokens: RadarToken[];
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatPrice(value: number) {
  if (value < 0.01) return `$${value.toPrecision(3)}`;
  return currency.format(value);
}

function App() {
  const [data, setData] = React.useState<RadarResponse | null>(null);
  const [selected, setSelected] = React.useState<RadarToken | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadRadar = React.useCallback(async () => {
    setIsLoading(true);
    const response = await fetch("/api/radar");
    const payload = (await response.json()) as RadarResponse;
    setData(payload);
    setSelected(payload.tokens[0] || null);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    void loadRadar();
  }, [loadRadar]);

  const tokens = data?.tokens ?? [];
  const averageScore = tokens.length
    ? Math.round(tokens.reduce((sum, token) => sum + token.score, 0) / tokens.length)
    : 0;
  const strongest = [...tokens].sort((a, b) => b.score - a.score)[0];

  return (
    <main>
      <section className="topbar">
        <div>
          <p className="eyebrow">Birdeye Data Sprint 4 Submission</p>
          <h1>Solana Token Opportunity Radar</h1>
        </div>
        <button className="iconButton" onClick={loadRadar} aria-label="Refresh radar data">
          <RefreshCcw size={18} />
        </button>
      </section>

      <section className="summaryGrid" aria-label="Radar summary">
        <Metric icon={<Activity />} label="Data mode" value={data?.mode === "live" ? "Live API" : "Demo"} />
        <Metric icon={<BarChart3 />} label="Average score" value={`${averageScore}/100`} />
        <Metric icon={<ShieldCheck />} label="Best signal" value={strongest?.symbol ?? "..."} />
        <Metric icon={<WalletCards />} label="Tokens checked" value={String(tokens.length || 0)} />
      </section>

      <section className="workspace">
        <div className="tokenList">
          <div className="sectionHeader">
            <h2>Trending Tokens</h2>
            <span>{isLoading ? "Refreshing" : "Ranked by risk-adjusted signal"}</span>
          </div>
          {tokens.map((token) => (
            <button
              key={token.address}
              className={`tokenRow ${selected?.address === token.address ? "active" : ""}`}
              onClick={() => setSelected(token)}
            >
              <span className="tokenAvatar">{token.symbol.slice(0, 2)}</span>
              <span>
                <strong>{token.symbol}</strong>
                <small>{token.name}</small>
              </span>
              <span className="score">{token.score}</span>
            </button>
          ))}
        </div>

        <div className="detailPanel">
          {selected ? (
            <>
              <div className="detailHeader">
                <div>
                  <p className="eyebrow">Selected Signal</p>
                  <h2>{selected.name}</h2>
                  <code>{selected.address}</code>
                </div>
                <div className="scoreBadge">{selected.score}</div>
              </div>
              <div className="insightGrid">
                <Insight label="Price" value={formatPrice(selected.price)} />
                <Insight label="24h Change" value={`${selected.priceChange24h.toFixed(2)}%`} tone={selected.priceChange24h >= 0 ? "good" : "watch"} />
                <Insight label="Liquidity" value={currency.format(selected.liquidity)} />
                <Insight label="24h Volume" value={currency.format(selected.volume24h)} />
                <Insight label="Trades" value={compact.format(selected.trade24h)} />
                <Insight label="Unique wallets" value={compact.format(selected.uniqueWallet24h)} />
              </div>
              <div className="explain">
                <Sparkles size={18} />
                <p>
                  The score favors tokens with deep liquidity, meaningful volume, active wallets, and lower extreme
                  volatility. It is a discovery aid, not financial advice or a trading signal.
                </p>
              </div>
            </>
          ) : (
            <div className="emptyState">Loading radar data...</div>
          )}
        </div>
      </section>

      <section className="method">
        <div>
          <h2>Birdeye endpoints used</h2>
          <p>
            The app combines trending discovery, token market data, and token trade data into a single contributor-friendly
            dashboard for researching Solana tokens quickly.
          </p>
        </div>
        <ul>
          {(data?.endpoints ?? []).map((endpoint) => (
            <li key={endpoint}>{endpoint}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      <div className="metricIcon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Insight({ label, value, tone }: { label: string; value: string; tone?: "good" | "watch" }) {
  return (
    <div className={`insight ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
