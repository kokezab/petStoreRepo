import { NavLink } from 'react-router';

export function NavBar() {
  return (
    <>
      <h1>Build: {__BUILD_TIME__}</h1>
      <nav>
        <NavLink to='/pets'>Pets</NavLink>
        <NavLink to='/inventory'>Inventory</NavLink>
        {/* pipeline smoke test */}
      </nav>
    </>
  );
}
