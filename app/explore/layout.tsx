import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore AI Model Performance - V3RA',
  description: 'Discover which AI models perform best across different categories and demographics.'
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}