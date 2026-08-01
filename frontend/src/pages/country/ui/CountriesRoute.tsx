import { CountriesPage } from '@/entities/country';

// Route-level composition. Keep this thin — page-level access guards
// (e.g. <RequirePermission subject="Country">) belong here, wrapping
// CountriesPage, since a user with zero permissions on an entity
// shouldn't even reach a codebook page that fetches its list.
export default function CountriesRoute() {
  return <CountriesPage />;
}
