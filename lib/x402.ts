// x402 Payment Protocol — USDC en Base
// Spec: https://x402.org
//
// Flow:
// 1. Cliente pide URL "protegida" (/api/x402/buy?slug=...)
// 2. Server devuelve 402 Payment Required con header X-Payment-Required
// 3. Wallet (Coinbase Smart Wallet, etc) construye y firma transferencia USDC
// 4. Cliente reintenta con header X-Payment (la firma)
// 5. Server verifica on-chain, si OK marca orden paid y retorna 200

import { createPublicClient, http, parseUnits, formatUnits } from "viem";
import { base } from "viem/chains";
import type { Artwork } from "./artworks";

// Dirección USDC oficial en Base
export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const USDC_DECIMALS = 6;

// Dirección donde se reciben pagos
// TODO: reemplazar por la dirección real de maarmapa.eth resuelta on-chain
export const PAYMENT_RECIPIENT =
  (process.env.X402_RECIPIENT_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
});

// Convierte CLP a USDC usando tipo de cambio del Artwork (priceUsd)
export function artworkToUsdcAmount(artwork: Artwork): bigint {
  return parseUnits(artwork.priceUsd.toString(), USDC_DECIMALS);
}

export function buildPaymentRequiredHeader(
  artwork: Artwork,
  shortId: string,
  origin: string
): { value: string; amount: bigint } {
  const amount = artworkToUsdcAmount(artwork);
  const header = {
    scheme: "x402",
    version: 1,
    network: "base",
    asset: USDC_BASE,
    amount: amount.toString(),
    amountReadable: `${artwork.priceUsd} USDC`,
    recipient: PAYMENT_RECIPIENT,
    description: `${artwork.title} by maarmapa`,
    callback: `${origin}/api/x402/verify?order=${shortId}`,
    expires: Math.floor(Date.now() / 1000) + 60 * 30, // 30 min
  };
  return { value: JSON.stringify(header), amount };
}

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
