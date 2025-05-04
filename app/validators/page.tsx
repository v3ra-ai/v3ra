import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getValidators } from "@/lib/db/validators";
import Image from "next/image";
import Link from "next/link";

export default async function ValidatorsPage() {
  const validators = await getValidators();

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
                {validators.map((validator) => (
                  <Link
                    key={validator.id}
                    href={`/validators/${validator.id}/profile`}
                    style={{ display: "contents" }}
                  >
                    <TableRow className="cursor-pointer">
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
                      <TableCell className="text-zinc-600 dark:text-zinc-300">{validator.profileName}</TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-300">{validator.provider}</TableCell>
                      <TableCell>
                        <span className="text-blue-600 dark:text-blue-400 hover:underline">
                          View Profile
                        </span>
                      </TableCell>
                    </TableRow>
                  </Link>
                ))}
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