import { render, screen } from '@testing-library/react';

import { QueryState } from './QueryState';

describe('QueryState', () => {
  const renderContent = (value: string) => <span>{value}</span>;

  it('shows a labelled loading indicator while loading', () => {
    render(
      <QueryState
        isLoading
        error={null}
        data={undefined}
        loadingLabel='Loading pets'
        errorFallback='Failed to load pets.'
      >
        {renderContent}
      </QueryState>,
    );

    expect(screen.getByRole('status', { name: 'Loading pets' })).toBeVisible();
  });

  it('shows the fallback message when the query errors without a server message', () => {
    render(
      <QueryState
        isLoading={false}
        error={{ code: 'ERR' }}
        data={undefined}
        loadingLabel='Loading pets'
        errorFallback='Failed to load pets.'
      >
        {renderContent}
      </QueryState>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load pets.');
  });

  it('treats undefined data (not loading, no error) as an error', () => {
    render(
      <QueryState
        isLoading={false}
        error={null}
        data={undefined}
        loadingLabel='Loading pet'
        errorFallback='Pet not found.'
      >
        {renderContent}
      </QueryState>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Pet not found.');
  });

  it('renders the empty message when the result is empty', () => {
    render(
      <QueryState
        isLoading={false}
        error={null}
        data={[] as string[]}
        loadingLabel='Loading pets'
        errorFallback='Failed to load pets.'
        isEmpty={(items) => items.length === 0}
        emptyMessage='No pets found'
      >
        {(items) => <span>{items.join(', ')}</span>}
      </QueryState>,
    );

    expect(screen.getByText('No pets found')).toBeVisible();
  });

  it('renders children with defined data', () => {
    render(
      <QueryState
        isLoading={false}
        error={null}
        data='Bella'
        loadingLabel='Loading pet'
        errorFallback='Pet not found.'
      >
        {renderContent}
      </QueryState>,
    );

    expect(screen.getByText('Bella')).toBeVisible();
  });
});
