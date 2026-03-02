import crypto from "crypto";

export const ANON_COOKIE = "pmrprep_anon_trial";
export const ANON_MAX = 3;

type Payload = { a: number; exp: number }; // a = answered count

const SECRET = process.env.TRIAL_COOKIE_SECRET || "";

function sign(data: string) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex");
}

export function encodeAnonTrial(answered: number) {
  if (!SECRET) throw new Error("TRIAL_COOKIE_SECRET is not set");
  const payload: Payload = {
    a: answered,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

export function decodeAnonTrial(value?: string | null) {
  if (!value) return { answered: 0, expired: false, valid: true };

  const [b64, sig] = value.split(".");
  if (!b64 || !sig) return { answered: 0, expired: false, valid: false };
  if (!SECRET) return { answered: 0, expired: false, valid: false };

  const expected = sign(b64);

  // timingSafeEqual requires same-length buffers
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return { answered: 0, expired: false, valid: false };
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return { answered: 0, expired: false, valid: false };

  const json = Buffer.from(b64, "base64url").toString("utf8");
  const payload = JSON.parse(json) as Payload;

  const expired = Date.now() > payload.exp;
  return { answered: payload.a ?? 0, expired, valid: true };
}
