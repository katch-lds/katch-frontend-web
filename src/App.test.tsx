import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('apresenta a área de gestão e o endereço da API configurado', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Katch — Área de gestão' })).toBeInTheDocument();
    expect(screen.getByTestId('api-base-url')).toHaveTextContent('API: http://api.test');
  });
});
