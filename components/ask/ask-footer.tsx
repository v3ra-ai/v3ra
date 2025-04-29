// Full width row
import QueryStoreDebugPanel from './debug/query-store-debug';

const FooterLinkColumn = ({ title, links }: { title: string; links: { href: string; label: string }[] }) => (
  <div>
    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{title}</h3>
    <ul className="space-y-2">
      {links.map(({ href, label }) => (
        <li key={label}>
          <a
            href={href}
            rel="noopener noreferrer"
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export default function AskFooter() {
  const aboutLinks = [
    { href: "#", label: "Our Mission" },
    { href: "#", label: "Team" },
    { href: "#", label: "Careers" },
  ];
  const supportLinks = [
    { href: "#", label: "Help Center" },
    { href: "#", label: "Contact Us" },
    { href: "#", label: "Community" },
  ];
  const legalLinks = [
    { href: "#", label: "Terms of Service" },
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Cookie Policy" },
  ];

  return (
    <footer className="w-full bg-zinc-100 dark:bg-zinc-900">
      <div className="w-full py-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <QueryStoreDebugPanel />
          <div className="text-center text-sm text-zinc-600 dark:text-zinc-400 mt-4">
            &copy; 2023 Your Company. All rights reserved.
          </div>
        </div>
      </div>
      {/* Three column row */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FooterLinkColumn title="About" links={aboutLinks} />
          <FooterLinkColumn title="Support" links={supportLinks} />
          <FooterLinkColumn title="Legal" links={legalLinks} />
        </div>
      </div>
    </footer>
  );
}