import Link from "next/link";
export default function QuickActions() {
  const quickActionLinks = [
    { name: "New Shift", href: "/schedule/new", icon: "+" },
    { name: "Add Staff", href: "/employees/newEmployee", icon: "+" },
    { name: "Create Event", href: "/events/newEvent", icon: "+" },
  ];

  return (
    <aside className="sidebar bg-gray-100 p-3 shadow-md">
      <h3 className="text-md font-semibold mb-6">Quick Actions</h3>
      <nav>
        {quickActionLinks.map((link, index) => (
          <Link key={index} href={link.href} className="button">
            <span>{link.icon}</span> {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
