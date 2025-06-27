import { prisma } from "@/lib/database";

export async function createOrGetUser(userId: string, email: string, name?: string) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      return { success: true, user: existingUser };
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email,
        name: name || email.split("@")[0], // Use email prefix as default name
      },
    });

    return { success: true, user: newUser };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}