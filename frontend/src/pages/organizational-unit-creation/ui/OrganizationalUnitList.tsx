import { Listy } from 'antd';

interface OrganizationalUnitListProps {
  units: string[];
}

export function OrganizationalUnitList({ units }: OrganizationalUnitListProps) {
  return <Listy<string> items={units} itemRender={(unit) => unit} rowKey={(unit) => unit} />;
}
