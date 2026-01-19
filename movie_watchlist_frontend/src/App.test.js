import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const STORAGE_KEY = 'movie_watchlist_items';

describe('Movie Watchlist App (UI behaviors)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('adding a movie via input + submit adds the item to the list', async () => {
    render(<App />);

    const input = screen.getByLabelText(/movie title/i);
    const addButton = screen.getByRole('button', { name: /^add$/i });

    await userEvent.type(input, 'Inception');
    expect(addButton).toBeEnabled();

    await userEvent.click(addButton);

    // New movie title should appear.
    expect(screen.getByText('Inception')).toBeInTheDocument();

    // Input should clear after successful add.
    expect(input).toHaveValue('');

    // Default status for a new item should be "Not watched".
    const list = screen.getByRole('list', { name: /movies in watchlist/i });
    const inceptionRow = within(list).getByText('Inception').closest('li');
    expect(inceptionRow).not.toBeNull();
    expect(within(inceptionRow).getByText(/status:/i)).toBeInTheDocument();
    expect(within(inceptionRow).getByText(/not watched/i)).toBeInTheDocument();
  });

  test('toggling watched state updates the status text and title styling', async () => {
    render(<App />);

    // Seeded movie exists by default.
    const titleEl = screen.getByText('The Matrix');
    expect(titleEl).toBeInTheDocument();

    // Initially "Not watched"
    const matrixRow = titleEl.closest('li');
    expect(matrixRow).not.toBeNull();
    expect(within(matrixRow).getByText(/not watched/i)).toBeInTheDocument();

    // And title should NOT have watched styling class yet.
    expect(titleEl).not.toHaveClass('is-watched');

    const toggleBtn = within(matrixRow).getByRole('button', {
      name: /mark as watched for the matrix/i,
    });

    await userEvent.click(toggleBtn);

    // After toggle: status text changes + title has class
    expect(within(matrixRow).getByText(/watched/i)).toBeInTheDocument();
    expect(screen.getByText('The Matrix')).toHaveClass('is-watched');
  });

  test('removing a movie removes it from the list', async () => {
    render(<App />);

    expect(screen.getByText('Spirited Away')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', {
      name: /remove spirited away from watchlist/i,
    });

    await userEvent.click(removeBtn);

    expect(screen.queryByText('Spirited Away')).not.toBeInTheDocument();
  });

  test('persistence: loads from localStorage on mount and saves to localStorage on change', async () => {
    const storedItems = [
      { id: 'a1', title: 'Arrival', watched: false, createdAt: 1700000000000 },
      { id: 'a2', title: 'Heat', watched: true, createdAt: 1700000001000 },
    ];

    const getItemSpy = jest
      .spyOn(window.Storage.prototype, 'getItem')
      .mockImplementation((key) => (key === STORAGE_KEY ? JSON.stringify(storedItems) : null));

    const setItemSpy = jest
      .spyOn(window.Storage.prototype, 'setItem')
      .mockImplementation(() => {});

    render(<App />);

    // Verify UI is loaded from storage (no default seed should appear).
    expect(screen.getByText('Arrival')).toBeInTheDocument();
    expect(screen.getByText('Heat')).toBeInTheDocument();
    expect(screen.queryByText('The Matrix')).not.toBeInTheDocument();
    expect(screen.queryByText('Spirited Away')).not.toBeInTheDocument();

    // The read happens during initial state initialization; depending on the environment,
    // it may occur before we can reliably assert call timing. Still, it should occur.
    expect(getItemSpy).toHaveBeenCalled();

    // The first save happens in a useEffect; wait for it.
    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalled();
    });

    // Trigger a change: toggle "Arrival" and ensure a subsequent save has Arrival watched=true.
    const list = screen.getByRole('list', { name: /movies in watchlist/i });
    const arrivalRow = within(list).getByText('Arrival').closest('li');
    expect(arrivalRow).not.toBeNull();

    const toggleArrivalBtn = within(arrivalRow).getByRole('button', {
      name: /mark as watched for arrival/i,
    });

    const callsBefore = setItemSpy.mock.calls.length;
    await userEvent.click(toggleArrivalBtn);

    await waitFor(() => {
      expect(setItemSpy.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    const lastCall = setItemSpy.mock.calls.at(-1);
    expect(lastCall[0]).toBe(STORAGE_KEY);

    const saved = JSON.parse(lastCall[1]);
    const savedArrival = saved.find((m) => m.title === 'Arrival');
    expect(savedArrival).toBeTruthy();
    expect(savedArrival.watched).toBe(true);
  });

  test('persistence: handles invalid localStorage data by falling back to defaults and still saving', async () => {
    const setItemSpy = jest
      .spyOn(window.Storage.prototype, 'setItem')
      .mockImplementation(() => {});

    jest.spyOn(window.Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === STORAGE_KEY) return '{not valid json';
      return null;
    });

    render(<App />);

    // Falls back to default seed items when storage is invalid
    expect(screen.getByText('The Matrix')).toBeInTheDocument();
    expect(screen.getByText('Spirited Away')).toBeInTheDocument();

    // Save happens in a useEffect; wait for it.
    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalled();
    });

    const lastCall = setItemSpy.mock.calls.at(-1);
    expect(lastCall[0]).toBe(STORAGE_KEY);
    expect(() => JSON.parse(lastCall[1])).not.toThrow();
  });

  test('validation: empty title shows an error and does not add an item', async () => {
    render(<App />);

    // Button is disabled when input is empty, but we can still submit the form via DOM event to
    // verify validation logic defensively.
    const form = screen.getByRole('form', { name: /add movie to watchlist/i });
    fireEvent.submit(form);

    expect(await screen.findByRole('alert')).toHaveTextContent(/please enter a movie title/i);
  });

  test('validation: duplicate title (case-insensitive) shows an error and does not add', async () => {
    render(<App />);

    const input = screen.getByLabelText(/movie title/i);
    const addButton = screen.getByRole('button', { name: /^add$/i });

    // "The Matrix" exists in the default seed, so adding a case-variant should error.
    await userEvent.type(input, 'the matrix');
    await userEvent.click(addButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(/already in your watchlist/i);

    // Ensure we still only have one "The Matrix" in the list.
    expect(screen.getAllByText('The Matrix')).toHaveLength(1);
  });
});
