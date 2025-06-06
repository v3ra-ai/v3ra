import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | Verafy",
  description: "Explore Verafy's comprehensive documentation for guides, APIs, and usage instructions.",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-center sm:text-3xl md:text-4xl">
            Verafy Documentation
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground sm:text-base">
            Guides, APIs, and usage instructions for Verafy
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <section className="prose dark:prose-invert max-w-prose mx-auto">
          <h2 className="text-xl font-semibold sm:text-2xl">
            Welcome to Verafy Docs
          </h2>
          <p className="mt-4 text-base sm:text-lg">
            This is a placeholder for your documentation content. Add sections,
            guides, or API references here to help users understand and use Verafy
            effectively.
          </p>
          <p className="mt-4 text-base sm:text-lg">
            Use the responsive layout to organize content, ensuring it’s accessible
            and easy to navigate on mobile and desktop devices.
          </p>
        </section>
      </main>
    </div>
  );
}