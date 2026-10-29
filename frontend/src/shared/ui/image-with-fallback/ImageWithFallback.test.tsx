import { fireEvent, render, screen } from '@testing-library/react';

import { ImageWithFallback } from './ImageWithFallback';

describe('ImageWithFallback', () => {
  it('renders the given src', () => {
    render(<ImageWithFallback src='pet.png' alt='Bella' fallbackSrc='fallback.png' />);
    expect(screen.getByAltText('Bella')).toHaveAttribute('src', 'pet.png');
  });

  it('falls back to fallbackSrc when the image fails to load', () => {
    render(<ImageWithFallback src='broken.png' alt='Bella' fallbackSrc='fallback.png' />);
    const img = screen.getByAltText('Bella');

    fireEvent.error(img);

    expect(img).toHaveAttribute('src', 'fallback.png');
  });

  it('does not loop if the fallback image also fails to load', () => {
    render(<ImageWithFallback src='broken.png' alt='Bella' fallbackSrc='fallback.png' />);
    const img = screen.getByAltText('Bella');

    fireEvent.error(img);
    fireEvent.error(img);

    expect(img).toHaveAttribute('src', 'fallback.png');
  });

  it('passes through other img props', () => {
    render(
      <ImageWithFallback
        src='pet.png'
        alt='Bella'
        fallbackSrc='fallback.png'
        className='pet-photo'
      />,
    );
    expect(screen.getByAltText('Bella')).toHaveClass('pet-photo');
  });
});
