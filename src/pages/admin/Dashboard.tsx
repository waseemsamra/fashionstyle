import DashboardStats from './DashboardStats';

type DashboardProps = { minimal?: boolean };

export default function Dashboard(_props: DashboardProps) {
  // Use the enhanced dashboard stats component
  return <DashboardStats />;
}
