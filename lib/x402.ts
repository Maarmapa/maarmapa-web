// x402 Payment Protocol — USDC en Base
// Spec: https://x402.org
//
// Flow:
// 1. Cliente pide URL "protegida" (/api/x402/buy?slug=...)
// 2. Server devuelve 402 Payment Required con header X-Payment-Required
// 3. Wallet (Coinbase Smart Wallet, etc) construye y firma transferencia USDC
// 4. Cliente reintenta con header X-Payment (la firma)
// 5. Server verifica on-chain, si OK marca orden paid y retorna 200
//
// Dirección receptora (getPaymentRecipient):
//   1. X402_RECIPIENT_ADDRESS si está seteada y es una dirección válida (≠ 0x0)
//   2. si no, maarmapa.eth resuelto vía ENS en mainnet (cache 1h en memoria)
//   3. si tampoco resuelve → PaymentRecipientUnavailableError (el caller
//      responde 503). NUNCA se devuelve la dirección cero: un pago a 0x0 se
//      quema y no hay forma de recuperarlo.

import {
  createPublicClient,
  fallback,
  http,
  parseUnits,
  formatUnits,
  type Address,
} from "viem";
import { base, mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import type { Artwork } from "./artworks";

// Dirección USDC oficial en Base
export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const USDC_DECIMALS = 6;

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

// Nombre ENS del artista. Se resuelve en mainnet (ENS vive ahí), aunque el
// pago se hace en Base: la dirección resuelta es la misma cuenta en ambas.
export const RECIPIENT_ENS_NAME = "maarmapa.eth";

// SLIP-44 coinType para Base según ENSIP-11 (0x80000000 | chainId).
// Si maarmapa.eth tiene un address record específico para Base, se prefiere;
// si no, se usa el record ETH por defecto (coinType 60).
const BASE_COIN_TYPE = BigInt(0x80000000 + base.id);

const ENS_CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const ENS_RESOLVE_TIMEOUT_MS = 10_000;

// RPCs públicos de mainnet para resolver ENS. Se prueban en orden.
// (cloudflare-eth.com NO está: su eth_call revierte con el Universal Resolver
// de viem — probado ago-2026.) ETH_MAINNET_RPC_URL permite anteponer uno propio.
const MAINNET_RPC_URLS = [
  "https://ethereum-rpc.publicnode.com",
  "https://eth.merkle.io",
  "https://1rpc.io/eth",
] as const;

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
});

// ─── Dirección receptora ─────────────────────────────────────────

export class PaymentRecipientUnavailableError extends Error {
  readonly status = 503 as const;
  constructor(message: string) {
    super(message);
    this.name = "PaymentRecipientUnavailableError";
  }
}

// true solo para 0x + 40 hex y distinta de la dirección cero.
export function isUsableAddress(value: unknown): value is Address {
  return (
    typeof value === "string" &&
    /^0x[0-9a-fA-F]{40}$/.test(value) &&
    value.toLowerCase() !== ZERO_ADDRESS
  );
}

function mainnetClient() {
  const urls = [
    ...(process.env.ETH_MAINNET_RPC_URL ? [process.env.ETH_MAINNET_RPC_URL] : []),
    ...MAINNET_RPC_URLS,
  ];
  return createPublicClient({
    chain: mainnet,
    transport: fallback(
      urls.map((url) => http(url, { timeout: 4_000, retryCount: 0 })),
      { rank: false }
    ),
  });
}

// Resuelve RECIPIENT_ENS_NAME on-chain. Devuelve null si no hay record.
// Exportada solo para poder probarla/inyectarla; usar getPaymentRecipient().
export async function resolveRecipientEns(): Promise<string | null> {
  const client = mainnetClient();
  const name = normalize(RECIPIENT_ENS_NAME);

  // 1) address record específico para Base (ENSIP-11)
  try {
    const onBase = await client.getEnsAddress({ name, coinType: BASE_COIN_TYPE });
    if (onBase) return onBase;
  } catch {
    // resolver viejo sin addr(bytes32,uint256) → seguimos con el record ETH
  }
  // 2) address record ETH (coinType 60), el estándar
  return client.getEnsAddress({ name });
}

type RecipientResolverDeps = {
  readEnv?: () => string | undefined;
  resolveEns?: () => Promise<string | null>;
  now?: () => number;
  ttlMs?: number;
  timeoutMs?: number;
  warn?: (msg: string) => void;
};

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${what}: timeout ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

// Fábrica (con cache propio) para poder testear sin red y sin estado global.
export function createPaymentRecipientResolver(
  deps: RecipientResolverDeps = {}
): () => Promise<Address> {
  const readEnv = deps.readEnv ?? (() => process.env.X402_RECIPIENT_ADDRESS);
  const resolveEns = deps.resolveEns ?? resolveRecipientEns;
  const now = deps.now ?? Date.now;
  const ttlMs = deps.ttlMs ?? ENS_CACHE_TTL_MS;
  const timeoutMs = deps.timeoutMs ?? ENS_RESOLVE_TIMEOUT_MS;
  const warn = deps.warn ?? ((m: string) => console.warn(m));

  let cached: { address: Address; expiresAt: number } | null = null;
  let inflight: Promise<Address> | null = null;

  async function resolveViaEns(): Promise<Address> {
    if (cached && cached.expiresAt > now()) return cached.address;
    if (inflight) return inflight;

    inflight = (async () => {
      let resolved: string | null;
      try {
        resolved = await withTimeout(
          resolveEns(),
          timeoutMs,
          `ENS ${RECIPIENT_ENS_NAME}`
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new PaymentRecipientUnavailableError(
          `x402: no se pudo resolver ${RECIPIENT_ENS_NAME} vía ENS (${msg}) y ` +
            `X402_RECIPIENT_ADDRESS no está configurada. Pago USDC no disponible.`
        );
      }
      // Guard explícito: ENS puede devolver null (sin record) o, en teoría,
      // la dirección cero. Ninguna de las dos es una cuenta receptora.
      if (!isUsableAddress(resolved)) {
        throw new PaymentRecipientUnavailableError(
          `x402: ${RECIPIENT_ENS_NAME} no tiene un address record válido ` +
            `(resolvió ${resolved ?? "null"}) y X402_RECIPIENT_ADDRESS no está ` +
            `configurada. Pago USDC no disponible.`
        );
      }
      cached = { address: resolved, expiresAt: now() + ttlMs };
      return resolved;
    })().finally(() => {
      inflight = null;
    });
    return inflight;
  }

  return async function getPaymentRecipient(): Promise<Address> {
    const env = readEnv()?.trim();
    if (isUsableAddress(env)) return env;
    if (env) {
      // Seteada pero inválida (o la cero copiada de un .env.example viejo):
      // la ignoramos y caemos a ENS en vez de mandar plata a 0x0.
      warn(
        `x402: X402_RECIPIENT_ADDRESS no es una dirección usable (largo ${env.length}); ` +
          `resolviendo ${RECIPIENT_ENS_NAME} vía ENS.`
      );
    }
    const address = await resolveViaEns();
    // Invariante final, redundante a propósito: por ninguna rama sale 0x0.
    if (!isUsableAddress(address)) {
      throw new PaymentRecipientUnavailableError(
        "x402: dirección receptora inválida (invariante violada)"
      );
    }
    return address;
  };
}

// Instancia compartida (cache en memoria del proceso, TTL 1h).
export const getPaymentRecipient = createPaymentRecipientResolver();

// ─── Header 402 ──────────────────────────────────────────────────

// Convierte CLP a USDC usando tipo de cambio del Artwork (priceUsd)
export function artworkToUsdcAmount(artwork: Artwork): bigint {
  return parseUnits(artwork.priceUsd.toString(), USDC_DECIMALS);
}

// Arma el header X-Payment-Required. Lanza PaymentRecipientUnavailableError
// si no hay dirección receptora: el caller debe responder 503 (nunca un 402
// apuntando a 0x0).
export async function buildPaymentRequiredHeader(
  artwork: Artwork,
  shortId: string,
  origin: string
): Promise<{ value: string; amount: bigint; recipient: Address }> {
  const recipient = await getPaymentRecipient();
  const amount = artworkToUsdcAmount(artwork);
  const header = {
    scheme: "x402",
    version: 1,
    network: "base",
    asset: USDC_BASE,
    amount: amount.toString(),
    amountReadable: `${artwork.priceUsd} USDC`,
    recipient,
    description: `${artwork.title} by maarmapa`,
    callback: `${origin}/api/x402/verify?order=${shortId}`,
    expires: Math.floor(Date.now() / 1000) + 60 * 30, // 30 min
  };
  return { value: JSON.stringify(header), amount, recipient };
}

// ─── Verificación on-chain ───────────────────────────────────────

// ERC20 Transfer event ABI
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export async function verifyUsdcPayment(
  txHash: `0x${string}`,
  expectedAmount: bigint,
  expectedRecipient: `0x${string}`
): Promise<{
  ok: boolean;
  payer?: `0x${string}`;
  amount?: bigint;
  reason?: string;
}> {
  // Un Transfer a 0x0 es un burn; jamás debe contar como pago recibido.
  if (!isUsableAddress(expectedRecipient)) {
    return { ok: false, reason: "Dirección receptora inválida" };
  }
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    if (receipt.status !== "success") {
      return { ok: false, reason: "Transacción revertida" };
    }

    // Buscar log de Transfer del USDC oficial al recipient
    const transfer = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === USDC_BASE.toLowerCase() &&
        log.topics[0] === TRANSFER_TOPIC &&
        // topic[2] = recipient (padded to 32 bytes)
        log.topics[2]?.toLowerCase().endsWith(
          expectedRecipient.toLowerCase().slice(2)
        )
    );
    if (!transfer) {
      return { ok: false, reason: "No se encontró transferencia USDC válida" };
    }

    const amount = BigInt(transfer.data);
    if (amount < expectedAmount) {
      return {
        ok: false,
        reason: `Monto insuficiente: ${formatUnits(
          amount,
          USDC_DECIMALS
        )} < ${formatUnits(expectedAmount, USDC_DECIMALS)} USDC`,
      };
    }

    const payerTopic = transfer.topics[1];
    const payer = payerTopic
      ? (`0x${payerTopic.slice(26)}` as `0x${string}`)
      : undefined;

    return { ok: true, payer, amount };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error verificando pago";
    return { ok: false, reason: msg };
  }
}
