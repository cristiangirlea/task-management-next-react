import { createHmac } from 'node:crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** The code an authenticator app shows for a base32 secret (RFC 6238), `steps` periods of 30 s from now. */
export function totp(secret: string, steps = 0): string {
    const bits = [...secret.replace(/=+$/, '').toUpperCase()]
        .map((char) => BASE32.indexOf(char).toString(2).padStart(5, '0'))
        .join('');
    const key = Buffer.from((bits.match(/.{8}/g) ?? []).map((byte) => parseInt(byte, 2)));
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000) + steps));
    const hmac = createHmac('sha1', key).update(counter).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    return ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, '0');
}
