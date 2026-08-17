// Tests de la dirección receptora x402 (sin red).
// Correr: npm run test:x402   (Node >= 22.18, usa type stripping nativo)
//
// Invariante que se prueba: getPaymentRecipient() JAMÁS devuelve 0x0.
//   env válida → env
//   env ausente/inválida/cero → ENS
//   ENS null/cero/error/timeout → PaymentRecipientUnavailableError

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentRecipientResolver,
  isUsableAddress,
  PaymentRecipientUnavailableError,
  ZERO_ADDRESS,
  verifyUsdcPayment,
} from "../lib/x402.ts";

const ENV_ADDR = "0x1111111111111111111111111111111111111111";
const ENS_ADDR = "0xBF44162160De5A72D16264592B182e2fE30Cf07A";
const quiet = { warn: () => {} };

test("isUsableAddress: 40 hex sí, cero/corta/basura no", () => {
  assert.equal(isUsableAddress(ENV_ADDR), true);
  assert.equal(isUsableAddress(ENS_ADDR), true);
  assert.equal(isUsableAddress(ZERO_ADDRESS), false);
  assert.equal(isUsableAddress("0x0000000000000000000000000000000000000000".toUpperCase().replace("0X", "0x")), false);
  assert.equal(isUsableAddress("0x1234"), false);
  assert.equal(isUsableAddress("maarmapa.eth"), false);
  assert.equal(isUsableAddress(undefined), false);
  assert.equal(isUsableAddress(null), false);
});

test("env válida → se usa la env, sin tocar ENS", async () => {
  let ensCalls = 0;
  const get = createPaymentRecipientResolver({
    ...quiet,
    readEnv: () => ENV_ADDR,
    resolveEns: async () => {
      ensCalls++;
      return ENS_ADDR;
    },
  });
  assert.equal(await get(), ENV_ADDR);
  assert.equal(ensCalls, 0);
});

test("env ausente → ENS", async () => {
  const get = createPaymentRecipientResolver({
    ...quiet,
    readEnv: () => undefined,
    resolveEns: async () => ENS_ADDR,
  });
  assert.equal(await get(), ENS_ADDR);
});

test("env = dirección cero (copiada de .env.example) → se ignora y va a ENS", async () => {
  const warns = [];
  const get = createPaymentRecipientResolver({
    warn: (m) => warns.push(m),
    readEnv: () => ZERO_ADDRESS,
    resolveEns: async () => ENS_ADDR,
  });
  assert.equal(await get(), ENS_ADDR);
  assert.equal(warns.length, 1);
});

test("env basura → se ignora y va a ENS", async () => {
  const get = createPaymentRecipientResolver({
    ...quiet,
    readEnv: () => "not-an-address",
    resolveEns: async () => ENS_ADDR,
  });
  assert.equal(await get(), ENS_ADDR);
});

test("ENS devuelve null → falla duro, nunca 0x0", async () => {
  const get = createPaymentRecipientResolver({
    ...quiet,
    readEnv: () => undefined,
    resolveEns: async () => null,
  });
  await assert.rejects(get(), PaymentRecipientUnavailableError);
});

test("ENS devuelve la dirección cero → falla duro", async () => {
  const get = createPaymentRecipientResolver({
    ...quiet,
    readEnv: () => undefined,
    resolveEns: async () => ZERO_ADDRESS,
  });
  await assert.rejects(get(), PaymentRecipientUnavailableError);
});

test("ENS lanza (RPC caído) → falla duro con status 503", async () => {
  const get = createPaymentRecipientResolver({
    ...quiet,
    readEnv: () => undefined,
    resolveEns: async () => {
      throw new Error("RPC down");
    },
  });
  await assert.rejects(get(), (e) => {
    assert.ok(e instanceof PaymentRecipientUnavailableError);
    assert.equal(e.status, 503);
    assert.match(e.message, /RPC down/);
    return true;
  });
});

test("ENS cuelga → timeout → falla duro", async () => {
  const get = createPaymentRecipientResolver({
    ...quiet,
    readEnv: () => undefined,
    timeoutMs: 20,
    resolveEns: () => new Promise(() => {}),
  });
  await assert.rejects(get(), PaymentRecipientUnavailableError);
});

test("cache: 1 sola llamada a ENS dentro del TTL, revalida después", async () => {
  let t = 1_000_000;
  let ensCalls = 0;
  const get = createPaymentRecipientResolver({
    ...quiet,
    readEnv: () => undefined,
    now: () => t,
    ttlMs: 1000,
    resolveEns: async () => {
      ensCalls++;
      return ENS_ADDR;
    },
  });
  await get();
  await get();
  t += 999;
  await get();
  assert.equal(ensCalls, 1);
  t += 2;
  await get();
  assert.equal(ensCalls, 2);
});

test("cache: llamadas concurrentes comparten una sola resolución", async () => {
  let ensCalls = 0;
  const get = createPaymentRecipientResolver({
    ...quiet,
    readEnv: () => undefined,
    resolveEns: async () => {
      ensCalls++;
      await new Promise((r) => setTimeout(r, 10));
      return ENS_ADDR;
    },
  });
  const all = await Promise.all([get(), get(), get()]);
  assert.deepEqual(all, [ENS_ADDR, ENS_ADDR, ENS_ADDR]);
  assert.equal(ensCalls, 1);
});

test("cache: un fallo NO se cachea; el siguiente intento vuelve a resolver", async () => {
  let ensCalls = 0;
  const get = createPaymentRecipientResolver({
    ...quiet,
    readEnv: () => undefined,
    resolveEns: async () => {
      ensCalls++;
      if (ensCalls === 1) throw new Error("flaky");
      return ENS_ADDR;
    },
  });
  await assert.rejects(get(), PaymentRecipientUnavailableError);
  assert.equal(await get(), ENS_ADDR);
  assert.equal(ensCalls, 2);
});

test("verifyUsdcPayment: con recipient 0x0 rechaza sin ir a la red", async () => {
  const r = await verifyUsdcPayment(
    "0x" + "ab".repeat(32),
    1n,
    ZERO_ADDRESS
  );
  assert.equal(r.ok, false);
  assert.match(r.reason, /inválida/);
});
