import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Toast from './Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render toast message', () => {
    const onClose = vi.fn();
    render(<Toast message="Test message" type="info" onClose={onClose} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should call onClose after duration', () => {
    const onClose = vi.fn();
    render(<Toast message="Test" type="info" onClose={onClose} duration={500} />);
    
    expect(onClose).not.toHaveBeenCalled();
    
    // Fast-forward time past duration
    vi.advanceTimersByTime(600);
    
    // Should have been called after duration elapsed
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have correct role and aria-live', () => {
    const onClose = vi.fn();
    render(<Toast message="Test" type="error" onClose={onClose} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('should render close button', () => {
    const onClose = vi.fn();
    render(<Toast message="Test" type="info" onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close notification');
    expect(closeButton).toBeInTheDocument();
    
    closeButton.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

