sed -i 's/export const Navbar: React.FC<NavbarProps> = ({/export const Navbar: React.FC<NavbarProps> = ({\n/g' src/components/Navbar.tsx
sed -i 's/const adjustDate/const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);\n  const unacknowledgedCount = unacknowledgedJobs.length;\n\n  const adjustDate/g' src/components/Navbar.tsx
