import { afterEach, describe, expect, it, vi } from 'vitest';
import { corriger, MESSAGE_QUERY_LENGTH, MESSAGE_TIMEOUT, MESSAGE_UNAVAILABLE } from './correction-client';
import { ANSWER_MAX_LENGTH, RELAIS_URL } from './config';

afterEach(() => vi.useRealTimers());

function reply(status: number, body: unknown): typeof fetch {
  return vi.fn(() =>
    Promise.resolve(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })),
  ) as unknown as typeof fetch;
}

describe('corriger', () => {
  it('posts the query to the relay and returns a correction', async () => {
    const fetchImpl = reply(200, { type: 'correction', text: 'Ligne 1\nLigne 2' });
    const result = await corriger('  JNG-PC-01 : C = 0,1 mol/L  ', { fetchImpl });
    expect(result).toEqual({ kind: 'correction', text: 'Ligne 1\nLigne 2' });
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0] ?? [];
    expect(url).toBe(RELAIS_URL);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ query: 'JNG-PC-01 : C = 0,1 mol/L' });
  });

  it('maps a 422 refus', async () => {
    const result = await corriger('bonjour toi', {
      fetchImpl: reply(422, { type: 'refus', text: 'Hors sujet.' }),
    });
    expect(result).toEqual({ kind: 'refus', text: 'Hors sujet.' });
  });

  it('keeps the relay message on a 5xx erreur', async () => {
    const result = await corriger('abc', {
      fetchImpl: reply(502, { type: 'erreur', text: 'Panne du moteur.' }),
    });
    expect(result).toEqual({ kind: 'erreur', text: 'Panne du moteur.' });
  });

  it('maps a network error to the unavailable message', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))) as unknown as typeof fetch;
    expect(await corriger('abc', { fetchImpl })).toEqual({ kind: 'erreur', text: MESSAGE_UNAVAILABLE });
  });

  it('maps malformed or unknown payloads to the unavailable message', async () => {
    for (const body of ['<html>502</html>', { type: 'autre', text: 'x' }, { type: 'correction' }]) {
      expect(await corriger('abc', { fetchImpl: reply(200, body) })).toEqual({
        kind: 'erreur',
        text: MESSAGE_UNAVAILABLE,
      });
    }
  });

  it('times out after 65 s by default', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    ) as unknown as typeof fetch;
    let settled = false;
    const pending = corriger('abc', { fetchImpl }).then((result) => {
      settled = true;
      return result;
    });
    await vi.advanceTimersByTimeAsync(64_999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toEqual({ kind: 'erreur', text: MESSAGE_TIMEOUT });
  });

  it('rejects out-of-range queries without a request', async () => {
    const fetchImpl = reply(200, { type: 'correction', text: 'x' });
    for (const query of ['  ab ', 'x'.repeat(1001)]) {
      expect(await corriger(query, { fetchImpl })).toEqual({ kind: 'erreur', text: MESSAGE_QUERY_LENGTH });
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('truncates answers above the size limit', async () => {
    const result = await corriger('abc', {
      fetchImpl: reply(200, { type: 'correction', text: 'a'.repeat(ANSWER_MAX_LENGTH + 10) }),
    });
    expect(result.text.length).toBeLessThan(ANSWER_MAX_LENGTH + 100);
    expect(result.text).toContain('Message coupé');
  });
});
