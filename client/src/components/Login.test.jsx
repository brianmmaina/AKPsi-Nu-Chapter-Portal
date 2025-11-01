import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';

describe('Login Component', () => {
  it('should render login form', () => {
    const handleLogin = vi.fn();
    render(<Login password="" setPassword={vi.fn()} handleLogin={handleLogin} />);
    
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter/i })).toBeInTheDocument();
  });

  it('should call handleLogin on form submit', async () => {
    const handleLogin = vi.fn((e) => e.preventDefault());
    const setPassword = vi.fn();
    
    render(<Login password="test" setPassword={setPassword} handleLogin={handleLogin} />);
    
    const form = screen.getByRole('button', { name: /enter/i }).closest('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(handleLogin).toHaveBeenCalledTimes(1);
    });
  });

  it('should update password on input change', () => {
    const setPassword = vi.fn();
    render(<Login password="" setPassword={setPassword} handleLogin={vi.fn()} />);
    
    const input = screen.getByLabelText('Password');
    fireEvent.change(input, { target: { value: 'newpassword' } });
    
    expect(setPassword).toHaveBeenCalledWith('newpassword');
  });

  it('should have required password field', () => {
    render(<Login password="" setPassword={vi.fn()} handleLogin={vi.fn()} />);
    
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('aria-required', 'true');
  });
});

