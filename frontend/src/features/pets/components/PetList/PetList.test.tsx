import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PetList } from './PetList';

describe('PetList', () => {
    it('shows loading indicator when isLoading is true', async () => {
        render(<PetList data={[]} noDataMessage='No pets found' isLoading />);
        expect(screen.getByText('Loading pets...')).toBeInTheDocument();
    });


    it('shows no loading indicator when isLoading is false', async () => {
        render(<PetList data={[]} noDataMessage='No pets found' isLoading={false} />);
        expect(screen.queryByText('Loading pets...')).not.toBeInTheDocument();
    });
});