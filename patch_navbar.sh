sed -i 's/import { ServerConfig } from '\''.\/types'\'';/import { ServerConfig, PrintJob } from '\''.\/types'\'';/g' src/components/Navbar.tsx
sed -i 's/unacknowledgedCount?: number;/unacknowledgedJobs?: PrintJob[];\n  onDismissNotification?: (id: string) => void;\n  onDismissAllNotifications?: () => void;/g' src/components/Navbar.tsx
sed -i 's/unacknowledgedCount = 0,/unacknowledgedJobs = [],\n  onDismissNotification,\n  onDismissAllNotifications,/g' src/components/Navbar.tsx
sed -i 's/const Navbar: React.FC<NavbarProps> = ({/const Navbar: React.FC<NavbarProps> = ({\n/g' src/components/Navbar.tsx
