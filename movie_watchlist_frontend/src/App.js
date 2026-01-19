import React, { useId, useMemo, useState } from 'react';
import './App.css';

/**
 * Small, single-file watchlist implementation.
 * - No persistence (in-memory only)
 * - Accessible form controls
 * - Simple actions: toggle watched, remove
 */

// PUBLIC_INTERFACE
function App() {
  /** Main watchlist screen: header, add form, and watchlist list with actions. */

  const inputId = useId();

  const [newTitle, setNewTitle] = useState('');
  const [movies, setMovies] = useState(() => [
    { id: 'm1', title: 'The Matrix', watched: false },
    { id: 'm2', title: 'Spirited Away', watched: true },
  ]);

  const trimmedTitle = newTitle.trim();

  const watchedCount = useMemo(
    () => movies.reduce((acc, m) => acc + (m.watched ? 1 : 0), 0),
    [movies]
  );

  const remainingCount = movies.length - watchedCount;

  // PUBLIC_INTERFACE
  function handleAddMovie(e) {
    /** Add a new movie to the watchlist (in-memory). */
    e.preventDefault();

    if (!trimmedTitle) return;

    const newMovie = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: trimmedTitle,
      watched: false,
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
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.02em' }}>
            Movie Watchlist
          </h1>
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
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Inception"
                autoComplete="off"
              />
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

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 12,
              color: 'var(--color-muted)',
              fontSize: 14,
            }}
            aria-label="Watchlist summary"
          >
            <span>
              Total: <strong style={{ color: 'var(--color-text)' }}>{movies.length}</strong>
            </span>
            <span>
              Remaining: <strong style={{ color: 'var(--color-text)' }}>{remainingCount}</strong>
            </span>
            <span>
              Watched: <strong style={{ color: 'var(--color-text)' }}>{watchedCount}</strong>
            </span>
          </div>
        </section>

        <main className="surface" style={{ padding: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Your watchlist</h2>

          {movies.length === 0 ? (
            <p style={{ margin: '12px 0 0', color: 'var(--color-muted)' }}>
              Your list is empty. Add a movie above.
            </p>
          ) : (
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
                      <div
                        style={{
                          fontWeight: 700,
                          textDecoration: movie.watched ? 'line-through' : 'none',
                        }}
                      >
                        {movie.title}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13, color: 'var(--color-muted)' }}>
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
                        {movie.watched ? 'Unwatch' : 'Watched'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-error"
                        onClick={() => handleRemove(movie.id)}
                        aria-label={`Remove ${movie.title} from watchlist`}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
