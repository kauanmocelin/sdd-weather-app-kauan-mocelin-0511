import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

describe('SearchBar', () => {
  it('não dispara a busca com o campo vazio', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    expect(screen.getByRole('searchbox', { name: 'Buscar cidade' })).toHaveValue('');
    fireEvent.submit(screen.getByRole('search', { name: 'Busca de cidades' }));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('não dispara a busca quando o campo contém apenas espaços', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    const searchbox = screen.getByRole('searchbox', { name: 'Buscar cidade' });
    await user.type(searchbox, '   ');
    fireEvent.submit(screen.getByRole('search', { name: 'Busca de cidades' }));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('dispara a busca com o termo digitado', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar cidade' }), 'Lisboa');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith('Lisboa');
  });
});
