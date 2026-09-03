import { List } from 'antd';

interface OrganizationalUnitListProps {
  units: string[];
}

export function OrganizationalUnitList({ units }: OrganizationalUnitListProps) {
  return (
    <List dataSource={units} renderItem={(unit) => <List.Item key={unit}>{unit}</List.Item>} />
  );
}
