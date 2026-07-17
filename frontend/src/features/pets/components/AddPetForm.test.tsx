import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { AddPetForm } from './AddPetForm';

describe('AddPetForm', () => {
  it('calls onSubmit with form values when submitted', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<AddPetForm onSubmit={onSubmit} isLoading={false} />);

    await user.type(screen.getByLabelText('Name'), 'Buddy');
    await user.type(screen.getByLabelText('Category'), 'Dog');
    await user.click(screen.getByLabelText('Status'));
    await user.click(await screen.findByTitle('available'));

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Buddy',
        category: 'Dog',
        status: 'available',
      });
    });
  });

  it('does not call onSubmit when required fields are empty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<AddPetForm onSubmit={onSubmit} isLoading={false} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('displays submission error message', () => {
    render(<AddPetForm onSubmit={vi.fn()} isLoading={false} error='Error adding pet' />);

    expect(screen.getByText('Error adding pet')).toBeVisible();
  });
});
