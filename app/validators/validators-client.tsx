"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Validator } from "@/lib/types";
import { getModelIconPath } from "@/lib/utils/icon-mapping";

// Utility function to truncate UUID to first two segments (e.g., "228db12f-5d5b-4e34-af58-1c0972b9164e" → "228db12f-5d5b...")
function truncateId(id: string): string {
  const parts = id.split("-");
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}...` : id;
}

interface ValidatorsClientProps {
  validators: Validator[];
}

export default function ValidatorsClient({ validators }: ValidatorsClientProps) {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
              Validators
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/ask">← Back to Ask</Link>
              </Button>
              <Button asChild>
                <Link href="/llms/manage">Manage LLMs</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {validators.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-zinc-600 dark:text-zinc-300">Image</TableHead>
                  <TableHead className="text-zinc-600 dark:text-zinc-300">ID</TableHead>
                  <TableHead className="text-zinc-600 dark:text-zinc-300">Profile Name</TableHead>
                  <TableHead className="text-zinc-600 dark:text-zinc-300">Provider</TableHead>
                  <TableHead className="text-zinc-600 dark:text-zinc-300">Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validators.map((validator) => {
                  return (
                    <TableRow
                      key={validator.id}
                      className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      onClick={() => router.push(`/validators/${validator.id}/profile`)}
                    >
                      <TableCell>
                        <Image
                          src={getModelIconPath(
                            validator.modelName || validator.profileName,
                            validator.provider,
                            validator.avatarUrl
                          )}
                          alt={validator.profileName}
                          width={40}
                          height={38}
                          className="object-contain"
                        />
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-300">
                        {truncateId(validator.id)}
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-300">
                        <Link
                          href={`/validators/${validator.id}/profile`}
                          className="text-sky-600 dark:text-sky-400 hover:underline"
                          onClick={(e) => e.stopPropagation()} // Prevent row click from triggering
                        >
                          {validator.profileName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-300">{validator.provider}</TableCell>
                      <TableCell>
                        <Link
                          href={`/validators/${validator.id}/profile`}
                          className="text-sky-600 dark:text-sky-400 hover:underline"
                          onClick={(e) => e.stopPropagation()} // Prevent row click from triggering
                        >
                          View Profile
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No validators available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}