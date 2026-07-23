import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { CreateOrderForm } from './CreateOrderForm';

describe('CreateOrderForm', () => {
  it('calls onSubmit with form values when submitted', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<CreateOrderForm onSubmit={onSubmit} isLoading={false} />);

    await user.type(screen.getByLabelText('Pet Id'), '1');
    await user.type(screen.getByLabelText('Quantity'), '2');
    await user.type(screen.getByLabelText('Ship Date'), '2026-07-23');
    await user.click(screen.getByLabelText('Status'));
    await user.click(await screen.findByTitle('placed'));

    await user.click(screen.getByRole('button', { name: 'Create order' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        petId: 1,
        quantity: 2,
        shipDate: '2026-07-23',
        status: 'placed',
      });
    });
  });

  it('does not call onSubmit when required fields are empty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<CreateOrderForm onSubmit={onSubmit} isLoading={false} />);

    await user.click(screen.getByRole('button', { name: 'Create order' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('displays submission error message', () => {
    render(<CreateOrderForm onSubmit={vi.fn()} isLoading={false} error='Error creating order' />);

    expect(screen.getByText('Error creating order')).toBeVisible();
  });
});
