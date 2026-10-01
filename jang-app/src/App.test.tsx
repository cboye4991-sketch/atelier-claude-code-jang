// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { STORAGE_KEY } from './lib/repository';

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

async function openNotebook(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: 'Mon carnet' }));
  await screen.findByText('Mes exercices');
}

describe('Exercices tab', () => {
  it('lists the 14 exercises with disabled phase-2 buttons and the validation badge', () => {
    render(<App />);
    expect(screen.getAllByRole('listitem').filter((li) => li.className.includes('card'))).toHaveLength(14);
    const buttons = screen.getAllByRole('button', { name: 'Corriger avec Jàng' });
    expect(buttons).toHaveLength(14);
    for (const button of buttons) expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getAllByText('Bientôt : correction en direct (phase 2)')).toHaveLength(14);
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
