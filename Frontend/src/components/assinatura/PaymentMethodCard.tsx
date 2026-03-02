import { useMemo } from "react";

export type CardBrand = "visa" | "mastercard" | string;

export interface PaymentMethodCardProps {
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  className?: string;
}

const cardGradients: Record<string, { from: string; to: string; via?: string }> = {
  visa: {
    from: "#1A1F71",
    to: "#2B3A8C",
    via: "#162576",
  },
  mastercard: {
    from: "#0A0A0A",
    to: "#2D2D2D",
    via: "#1A1A1A",
  },
};

function getGradient(brand: CardBrand) {
  const key = String(brand).toLowerCase();
  return cardGradients[key] || { from: "#1a1a2e", to: "#16213e", via: "#0f3460" };
}

export function PaymentMethodCard({
  brand,
  last4,
  expMonth,
  expYear,
  className = "",
}: PaymentMethodCardProps) {
  const gradient = useMemo(() => getGradient(brand), [brand]);
  const expStr = `${String(expMonth).padStart(2, "0")}/${expYear}`;
  const brandLabel =
    brand === "visa" ? "Visa" : brand === "mastercard" ? "Mastercard" : String(brand);

  return (
    <div
      className={`overflow-hidden rounded-[14px] shadow-lg transition-transform hover:scale-[1.02] ${className}`}
      style={{ aspectRatio: "1.586" }}
    >
      <svg
        viewBox="0 0 320 202"
        className="h-full w-full block"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={`Cartão ${brandLabel} terminado em ${last4}`}
      >
        <defs>
          <linearGradient
            id={`cardGrad-${brand}-${last4}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={gradient.from} />
            {gradient.via && <stop offset="50%" stopColor={gradient.via} />}
            <stop offset="100%" stopColor={gradient.to} />
          </linearGradient>
          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.25" />
          </filter>
        </defs>
        {/* Corpo do cartão */}
        <rect
          x="2"
          y="2"
          width="316"
          height="198"
          rx="14"
          ry="14"
          fill={`url(#cardGrad-${brand}-${last4})`}
          filter="url(#cardShadow)"
        />
        <rect
          x="2"
          y="2"
          width="316"
          height="198"
          rx="14"
          ry="14"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        {/* Chip (posição fixa no SVG em coordenadas do viewBox) */}
        <g transform="translate(24, 32)">
          <rect
            x="0"
            y="0"
            width="44"
            height="34"
            rx="5"
            fill={`url(#chipGradCard-${brand}-${last4})`}
          />
          <rect
            x="0"
            y="0"
            width="44"
            height="34"
            rx="5"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.8"
          />
        </g>
        <defs>
          <linearGradient id={`chipGradCard-${brand}-${last4}`} x1="0" y1="0" x2="44" y2="34">
            <stop stopColor="#D4AF37" />
            <stop offset="0.5" stopColor="#F4E4BC" />
            <stop offset="1" stopColor="#C5A028" />
          </linearGradient>
        </defs>
        {/* Número mascarado */}
        <text
          x="24"
          y="115"
          fill="rgba(255,255,255,0.95)"
          fontFamily="ui-monospace, 'Cascadia Code', 'SF Mono', monospace"
          fontSize="22"
          fontWeight="500"
          letterSpacing="3"
        >
          •••• •••• •••• {last4}
        </text>
        {/* Valid Thru */}
        <text
          x="24"
          y="148"
          fill="rgba(255,255,255,0.6)"
          fontFamily="system-ui, sans-serif"
          fontSize="9"
          fontWeight="500"
        >
          VÁLIDO ATÉ
        </text>
        <text
          x="24"
          y="165"
          fill="rgba(255,255,255,0.95)"
          fontFamily="ui-monospace, monospace"
          fontSize="14"
          fontWeight="600"
        >
          {expStr}
        </text>
        {/* Bandeira (canto inferior direito) */}
        <g transform="translate(220, 150)">
          {brand === "visa" ? (
            <text
              fill="rgba(255,255,255,0.95)"
              fontFamily="system-ui, sans-serif"
              fontSize="18"
              fontWeight="700"
            >
              VISA
            </text>
          ) : brand === "mastercard" ? (
            <g transform="scale(1.8)">
              <circle cx="8" cy="10" r="6.5" fill="#EB001B" />
              <circle cx="18" cy="10" r="6.5" fill="#F79E1B" />
              <path
                d="M13 5.2a6.5 6.5 0 0 1 0 9.6 6.5 6.5 0 0 1 0-9.6z"
                fill="#FF5F00"
              />
            </g>
          ) : (
            <text
              fill="rgba(255,255,255,0.9)"
              fontFamily="system-ui, sans-serif"
              fontSize="12"
              fontWeight="600"
            >
              {brandLabel}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}
