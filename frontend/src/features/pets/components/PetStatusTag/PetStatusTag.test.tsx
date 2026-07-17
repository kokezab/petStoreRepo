import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PetStatusTag } from './PetStatusTag';

describe('PetStatusTag', () => {
  it('shows the available status', () => {
    render(<PetStatusTag status='available' />);
    expect(screen.getByText(/available/i)).toBeInTheDocument();
  });

  it('shows the pending status', () => {
    render(<PetStatusTag status='pending' />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('shows the sold status', () => {
    render(<PetStatusTag status='sold' />);
    expect(screen.getByText(/sold/i)).toBeInTheDocument();
  });

  it('renders nothing when status is undefined', () => {
    const { container } = render(<PetStatusTag status={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
