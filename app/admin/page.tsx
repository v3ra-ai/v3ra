import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  Key, 
  Shield, 
  Database, 
  CreditCard,
  AlertTriangle,
  Wrench,
  Heart
} from 'lucide-react';

const adminSections = [
  {
    title: 'LLM Health Monitor',
    description: 'Monitor health status of all LLM providers and models',
    href: '/admin/llm-health',
    icon: Heart,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20'
  },
  {
    title: 'Validator Manager',
    description: 'Manage AI validators and their configurations',
    href: '/admin/validators',
    icon: Activity,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20'
  },
  {
    title: 'API Keys',
    description: 'Manage API keys for different providers',
    href: '/admin/keys',
    icon: Key,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20'
  },
  {
    title: 'RLS Monitor',
    description: 'Row Level Security monitoring and compliance',
    href: '/admin/rls',
    icon: Shield,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20'
  },
  {
    title: 'Cache Manager',
    description: 'Monitor and manage application cache',
    href: '/admin/cache',
    icon: Database,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20'
  },
  {
    title: 'Credit Allocations',
    description: 'Monitor daily credit allocation system',
    href: '/admin/credits',
    icon: CreditCard,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20'
  },
  {
    title: 'Diagnose Keys',
    description: 'Diagnose and troubleshoot API key issues',
    href: '/admin/diagnose',
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20'
  },
  {
    title: 'Repair Keys',
    description: 'Fix API key relationships and issues',
    href: '/admin/repair',
    icon: Wrench,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20'
  }
];

export default function AdminDashboard() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Central hub for system administration and monitoring
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-3`}>
                    <Icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}