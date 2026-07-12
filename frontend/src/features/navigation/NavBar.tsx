import { NavLink } from 'react-router';

export function NavBar() {
  return (
    <nav>
      <NavLink to='/pets'>Pets</NavLink>
      <NavLink to='/inventory'>Inventory</NavLink>
    </nav>
  );
}
