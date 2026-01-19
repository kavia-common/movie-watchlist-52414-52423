import { render, screen } from '@testing-library/react';
import App from './App';

test('renders movie watchlist header', () => {
  render(<App />);
  expect(screen.getByText(/movie watchlist/i)).toBeInTheDocument();
});
