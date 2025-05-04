import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Validator } from "@/lib/types";
import { PrismaClient } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

const prisma = new PrismaClient();

// Fetch all validators from the database
async function getValidators(): Promise<Validator[]> {
  try {
    const validators = await prisma.validator.findMany();
    // Log fetched validators for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("Fetched validators:", validators);
    }
    return validators.map((validator) => ({
      id: validator.id,
      publicKey: validator.publicKey,
      isLeader: validator.isLeader,
      provider: validator.provider,
      profileName: validator.profileName,
      modelName: validator.modelName,
      description: validator.description,
      avatarUrl: validator.avatarUrl,
      validatorType: validator.validatorType,
      reliability: validator.reliability,
      totalVotes: validator.totalVotes,
      correctVotes: validator.correctVotes,
      active: validator.active,
      createdAt: validator.createdAt,
      updatedAt: validator.updatedAt,
    }));
  } catch (error) {
    console.error("Error fetching validators:", error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

export default async function ValidatorsPage() {
  const validators = await getValidators();

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
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
                  <TableRow key={validator.id}>
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
                      <Link
                        href={`/validators/${validator.id}/profile`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Profile
                      </Link>
                    </TableCell>
                  </TableRow>
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