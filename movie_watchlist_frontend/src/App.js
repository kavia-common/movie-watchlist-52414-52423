import React, { useEffect, useId, useMemo, useState } from 'react';
import './App.css';

/**
 * Small, single-file watchlist implementation.
 * - localStorage persistence
 * - Accessible form controls
 * - Simple actions: toggle watched, remove
 */

const STORAGE_KEY = 'movie_watchlist_items';

/**
 * Safely parse watchlist items from localStorage.
 * Returns null if storage missing/invalid.
 */
function readWatchlistFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    // Validate/coerce shape (defensive against older/bad data).
    const items = parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;

        const title = typeof item.title === 'string' ? item.title : '';
        const id = typeof item.id === 'string' ? item.id : '';
        const watched = typeof item.watched === 'boolean' ? item.watched : false;
        const createdAt =
          typeof item.createdAt === 'number' ? item.createdAt : Date.now();

        if (!id || !title.trim()) return null;

        return { id, title: title.trim(), watched, createdAt };
      })
      .filter(Boolean);

    return items;
  } catch {
    return null;
  }
}

/**
 * Safely write watchlist items to localStorage.
 */
function writeWatchlistToStorage(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors (e.g., private mode, quota).
  }
}

// PUBLIC_INTERFACE
function App() {
  /** Main watchlist screen: header, add form, and watchlist list with actions. */

  const inputId = useId();

  const [newTitle, setNewTitle] = useState('');
  const [formError, setFormError] = useState('');

  const [movies, setMovies] = useState(() => {
    const stored = readWatchlistFromStorage();
    if (stored) return stored;

    // Default seed if nothing stored yet.
    return [
      { id: 'm1', title: 'The Matrix', watched: false, createdAt: Date.now() - 86400000 * 2 },
      { id: 'm2', title: 'Spirited Away', watched: true, createdAt: Date.now() - 86400000 },
    ];
  });

  // Persist to localStorage on any change.
  useEffect(() => {
    writeWatchlistToStorage(movies);
  }, [movies]);

  const trimmedTitle = newTitle.trim();

  const watchedCount = useMemo(
    () => movies.reduce((acc, m) => acc + (m.watched ? 1 : 0), 0),
    [movies]
  );

  const remainingCount = movies.length - watchedCount;

  const normalizedNewTitle = trimmedTitle.toLocaleLowerCase();

  // PUBLIC_INTERFACE
  function handleAddMovie(e) {
    /** Add a new movie to the watchlist (persisted to localStorage). */
    e.preventDefault();

    setFormError('');

    // Validation: disallow empty/whitespace-only.
    if (!trimmedTitle) {
      setFormError('Please enter a movie title.');
      return;
    }

    // Simple duplicate rule: ignore exact duplicates (case-insensitive).
    const isDuplicate = movies.some(
      (m) => m.title.trim().toLocaleLowerCase() === normalizedNewTitle
    );
    if (isDuplicate) {
      setFormError('That movie is already in your watchlist.');
      return;
    }

    const newMovie = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: trimmedTitle,
      watched: false,
      createdAt: Date.now(),
    };

    setMovies((prev) => [newMovie, ...prev]);
    setNewTitle('');
  }

  // PUBLIC_INTERFACE
  function handleToggleWatched(id) {
    /** Toggle watched/unwatched state for a movie. */
    setMovies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, watched: !m.watched } : m))
    );
  }

  // PUBLIC_INTERFACE
  function handleRemove(id) {
    /** Remove a movie from the watchlist. */
    setMovies((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="App">
      <div style={{ width: '100%', maxWidth: 860, margin: '0 auto', padding: '28px 16px 44px' }}>
        <header style={{ marginBottom: 18 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.02em' }}>
              Movie Watchlist
            </h1>

            <div className="watchlist-summary" aria-label="Watchlist counters">
              <span>
                Total: <strong>{movies.length}</strong>
              </span>
              <span>
                Watched: <strong>{watchedCount}</strong>
              </span>
            </div>
          </div>

          <p style={{ margin: '8px 0 0', color: 'var(--color-muted)' }}>
            Add movies you want to watch, mark them watched, or remove them.
          </p>
        </header>

        <section className="surface" style={{ padding: 16, marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Add a movie</h2>

          <form
            onSubmit={handleAddMovie}
            aria-label="Add movie to watchlist"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 10,
              alignItems: 'end',
              marginTop: 12,
            }}
          >
            <div>
              <label htmlFor={inputId} style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                Movie title
              </label>
              <input
                id={inputId}
                className="input"
                type="text"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="e.g., Inception"
                autoComplete="off"
                aria-invalid={formError ? 'true' : 'false'}
                aria-describedby={formError ? `${inputId}-error` : undefined}
              />
              {formError ? (
                <div
                  id={`${inputId}-error`}
                  role="alert"
                  style={{ marginTop: 8, fontSize: 13, color: 'var(--color-error)', fontWeight: 600 }}
                >
                  {formError}
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!trimmedTitle}
              aria-disabled={!trimmedTitle}
              style={{ height: 42, whiteSpace: 'nowrap' }}
            >
              Add
            </button>
          </form>
        </section>

        <main className="surface" style={{ padding: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Your watchlist</h2>

          {movies.length === 0 ? (
            <div className="empty-state" role="status" aria-live="polite">
              <div style={{ fontWeight: 700, marginBottom: 4 }}>No movies yet</div>
              <div>
                Start building your list by adding a title above. Tip: try something you’ve been meaning to watch.
              </div>
            </div>
          ) : (
            <>
              <div className="watchlist-summary" aria-label="Watchlist summary">
                <span>
                  Remaining: <strong>{remainingCount}</strong>
                </span>
              </div>

              <ul
                aria-label="Movies in watchlist"
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '12px 0 0',
                  display: 'grid',
                  gap: 10,
                }}
              >
                {movies.map((movie) => {
                  const statusText = movie.watched ? 'Watched' : 'Not watched';
                  const toggleLabel = movie.watched ? 'Mark as not watched' : 'Mark as watched';

                  return (
                    <li
                      key={movie.id}
                      className="surface"
                      style={{
                        padding: 12,
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 10,
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div className={`movie-title ${movie.watched ? 'is-watched' : ''}`}>
                          {movie.title}
                        </div>
                        <div className="movie-status">
                          Status: <span>{statusText}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className={movie.watched ? 'btn' : 'btn btn-success'}
                          onClick={() => handleToggleWatched(movie.id)}
                          aria-label={`${toggleLabel} for ${movie.title}`}
                        >
                          {movie.watched ? 'Mark unwatch' : 'Mark watched'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-error"
                          onClick={() => handleRemove(movie.id)}
                          aria-label={`Remove ${movie.title} from watchlist`}
                        >
                          Remove movie
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
