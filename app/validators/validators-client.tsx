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
import { Validator } from "@/lib/types";


interface ValidatorsClientProps {
  validators: Validator[];
}

export default function ValidatorsClient({ validators }: ValidatorsClientProps) {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
            Validators
          </CardTitle>
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
                  console.log(validators);

                  console.log(`/icons/${validator.avatarUrl}`);

                  return (
                  <TableRow
                    key={validator.id}
                    className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={() => router.push(`/validators/${validator.id}/profile`)}
                  >
                    <TableCell>
                      <Image
                        src={
                          validator.avatarUrl
                            ? `/icons/${validator.avatarUrl}`
                            : "/icons/placeholder.png"
                        }
                        alt={validator.profileName}
                        width={40}
                        height={38}
                        className="grayscale object-contain"
                      />
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-300">{validator.id}</TableCell>
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
                )})}
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