// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { STORAGE_KEY } from './lib/repository';

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

async function openNotebook(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: 'Mon carnet' }));
  await screen.findByText('Mes exercices');
}

describe('Mon carnet, empty', () => {
  it('explains that the notebook is empty', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotebook(user);
    expect(screen.getByText(/Ton carnet est vide/)).toBeTruthy();
  });
});

describe('Exercices tab', () => {
  it('lists the 14 exercises with enabled correction buttons and the validation badge', () => {
    render(<App />);
    expect(screen.getAllByRole('listitem').filter((li) => li.className.includes('card'))).toHaveLength(14);
    const buttons = screen.getAllByRole('button', { name: 'Corriger avec Jàng' });
    expect(buttons).toHaveLength(14);
    for (const button of buttons) expect((button as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText(/Bientôt/)).toBeNull();
    expect(screen.getAllByText('Corrigé à valider par un professeur')).toHaveLength(14);
  });

  it('filters by subject and by text', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Chimie' }));
    expect(screen.getByRole('status').textContent).toBe('6 exercices sur 14');
    await user.type(screen.getByRole('searchbox'), 'dosage');
    expect(screen.getByRole('status').textContent).toBe('1 exercice sur 14');
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzzz');
    expect(screen.getByText(/Aucun exercice ne correspond/)).toBeTruthy();
  });

  it('shows the date, the overall progress and filters by notebook status', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(document.querySelector('header time')?.textContent).toMatch(/\d/);
    expect(screen.getByLabelText('Ma progression').textContent).toContain('0 réussi sur 14');

    await user.click(screen.getByRole('button', { name: 'Réussi' }));
    expect(screen.getByText(/Aucun exercice ne correspond/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Tous' }));
    // Set one status through the notebook tab, then filter on it.
    await user.click(screen.getByRole('tab', { name: 'Mon carnet' }));
    await screen.findByText('Mes exercices');
    await user.click(screen.getAllByLabelText('Réussi')[0]!);
    await user.click(screen.getByRole('tab', { name: 'Exercices' }));
    expect(screen.getByLabelText('Ma progression').textContent).toContain('1 réussi sur 14');
    await user.click(screen.getByRole('button', { name: 'Réussi' }));
    expect(screen.getByRole('status').textContent).toBe('1 exercice sur 14');
    await user.click(screen.getByRole('button', { name: 'À faire' }));
    expect(screen.getByRole('status').textContent).toBe('13 exercices sur 14');
  });
});

function mockRelay(...responses: Array<{ status: number; body: unknown } | Error>) {
  const queue = [...responses];
  const fetchMock = vi.fn(() => {
    const next = queue.shift();
    if (next === undefined || next instanceof Error) return Promise.reject(next ?? new Error('no reply'));
    return Promise.resolve(new Response(JSON.stringify(next.body), { status: next.status }));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function card(id: string): HTMLElement {
  return screen.getByText(id, { selector: '.exercise-id' }).closest('li') as HTMLElement;
}

describe('Correction panel', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('opens prefilled, and only one panel at a time', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(within(card('JNG-PC-01')).getByRole('button', { name: 'Corriger avec Jàng' }));
    expect((await within(card('JNG-PC-01')).findByRole('textbox')).textContent).toBe('JNG-PC-01 : ');
    await user.click(within(card('JNG-PC-02')).getByRole('button', { name: 'Corriger avec Jàng' }));
    expect((await within(card('JNG-PC-02')).findByRole('textbox') as HTMLTextAreaElement).value).toBe('JNG-PC-02 : ');
    expect(screen.getAllByRole('textbox', { name: 'Ta réponse' })).toHaveLength(1);
  });

  it('shows the waiting state, the answer as plain text, and files the result in the notebook', async () => {
    const user = userEvent.setup();
    let release: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (release = resolve)));
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    const li = card('JNG-PC-01');
    await user.click(within(li).getByRole('button', { name: 'Corriger avec Jàng' }));
    await user.type(await within(li).findByRole('textbox'), 'C = 0,1 mol/L');
    await user.click(within(li).getByRole('button', { name: 'Envoyer' }));
    expect(within(li).getByText(/Jàng écrit/)).toBeTruthy();

    release(
      new Response(JSON.stringify({ type: 'correction', text: 'Ligne 1\nVoir <b>ici</b>' }), { status: 200 }),
    );
    const answer = await within(li).findByText(/Voir <b>ici<\/b>/);
    expect(answer.textContent).toBe('Ligne 1\nVoir <b>ici</b>');
    expect(li.querySelector('b')).toBeNull();
    expect(within(li).getByText('Jàng peut se tromper : en cas de doute, demande à un professeur.')).toBeTruthy();

    await user.click(within(li).getByRole('button', { name: "J'ai compris → Réussi" }));
    expect(within(li).getByText('Réussi', { selector: '.status-pill' })).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')['JNG-PC-01'].status).toBe('solved');
  });

  it('offers a retry after a network error', async () => {
    const user = userEvent.setup();
    const fetchMock = mockRelay(new TypeError('offline'), { status: 200, body: { type: 'correction', text: 'OK' } });
    render(<App />);
    const li = card('JNG-PC-03');
    await user.click(within(li).getByRole('button', { name: 'Corriger avec Jàng' }));
    await user.type(await within(li).findByRole('textbox'), 'abc');
    await user.click(within(li).getByRole('button', { name: 'Envoyer' }));
    expect(await within(li).findByText(/Jàng est indisponible/)).toBeTruthy();
    await user.click(within(li).getByRole('button', { name: 'Réessayer' }));
    expect(await within(li).findByText('OK')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shows a refus as is, without status buttons', async () => {
    const user = userEvent.setup();
    mockRelay({ status: 422, body: { type: 'refus', text: 'Cette demande est hors sujet.' } });
    render(<App />);
    const li = card('JNG-PC-04');
    await user.click(within(li).getByRole('button', { name: 'Corriger avec Jàng' }));
    await user.type(await within(li).findByRole('textbox'), 'blabla');
    await user.click(within(li).getByRole('button', { name: 'Envoyer' }));
    expect(await within(li).findByText('Cette demande est hors sujet.')).toBeTruthy();
    expect(within(li).queryByRole('button', { name: 'À revoir' })).toBeNull();
    expect(within(li).queryByText(/Jàng peut se tromper/)).toBeNull();
  });
});

describe('Mon carnet', () => {
  it('keeps status and note after a page refresh (remount)', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await openNotebook(user);

    const row = screen.getByText('JNG-PC-03').closest('li') as HTMLElement;
    await user.click(within(row).getByLabelText('Réussi'));
    await user.click(within(row).getByText('Ajouter une note'));
    await user.type(within(row).getByRole('textbox'), 'Revoir pKa');

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')['JNG-PC-03']).toMatchObject({
      status: 'solved',
      note: 'Revoir pKa',
    });

    first.unmount(); // simulates closing the page; localStorage stays
    render(<App />);
    await openNotebook(user);

    const again = screen.getByText('JNG-PC-03').closest('li') as HTMLElement;
    expect((within(again).getByLabelText('Réussi') as HTMLInputElement).checked).toBe(true);
    expect((within(again).getByRole('textbox') as HTMLTextAreaElement).value).toBe('Revoir pKa');
    expect(screen.getByText(/^1 réussi sur 14 · 1 commencé$/)).toBeTruthy();
  });

  it('resets with an in-page confirmation and never calls window.confirm', async () => {
    const user = userEvent.setup();
    let confirmCalled = false;
    window.confirm = () => {
      confirmCalled = true;
      return true;
    };
    render(<App />);
    await openNotebook(user);
    const row = screen.getByText('JNG-PC-05').closest('li') as HTMLElement;
    await user.click(within(row).getByLabelText('À revoir'));

    await user.click(screen.getByRole('button', { name: 'Remettre mon carnet à zéro' }));
    await user.click(screen.getByRole('button', { name: 'Non, je garde mon carnet' }));
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Remettre mon carnet à zéro' }));
    await user.click(screen.getByRole('button', { name: 'Oui, tout effacer' }));
    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull());
    expect(screen.getByText('0 réussi sur 14')).toBeTruthy();
    expect(confirmCalled).toBe(false);
  });

  it('still works and warns when localStorage is unavailable', async () => {
    const user = userEvent.setup();
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
    try {
      render(<App />);
      await openNotebook(user);
      expect(screen.getByText('Ton carnet ne sera pas gardé si tu fermes la page.')).toBeTruthy();
      const row = screen.getByText('JNG-PC-01').closest('li') as HTMLElement;
      await user.click(within(row).getByLabelText('Essayé'));
      expect((within(row).getByLabelText('Essayé') as HTMLInputElement).checked).toBe(true);
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });
});

describe('Export du carnet', () => {
  it('is disabled while the notebook is empty', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openNotebook(user);
    expect((screen.getByRole('button', { name: 'Exporter mon carnet' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('downloads jang-carnet-AAAA-MM-JJ.json with the student entries', async () => {
    const user = userEvent.setup();
    const blobs: Blob[] = [];
    const downloads: string[] = [];
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const originalClick = HTMLAnchorElement.prototype.click;
    URL.createObjectURL = (blob: Blob | MediaSource) => {
      blobs.push(blob as Blob);
      return 'blob:jang-test';
    };
    URL.revokeObjectURL = () => undefined;
    HTMLAnchorElement.prototype.click = function click(this: HTMLAnchorElement) {
      downloads.push(this.download);
    };
    try {
      render(<App />);
      await openNotebook(user);
      const row = screen.getByText('JNG-PC-03').closest('li') as HTMLElement;
      await user.click(within(row).getByLabelText('Réussi'));

      await user.click(screen.getByRole('button', { name: 'Exporter mon carnet' }));

      expect(downloads).toHaveLength(1);
      expect(downloads[0]).toMatch(/^jang-carnet-\d{4}-\d{2}-\d{2}\.json$/);
      expect(screen.getByRole('status').textContent).toBe(`Fichier ${downloads[0]} téléchargé.`);

      const exported = JSON.parse(await (blobs[0] as Blob).text()) as {
        exportedAt: string;
        exercises: { id: string; status: string }[];
      };
      expect(exported.exercises).toHaveLength(14);
      expect(exported.exercises.find((entry) => entry.id === 'JNG-PC-03')?.status).toBe('solved');
      expect(Number.isNaN(Date.parse(exported.exportedAt))).toBe(false);
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      HTMLAnchorElement.prototype.click = originalClick;
    }
  });
});
