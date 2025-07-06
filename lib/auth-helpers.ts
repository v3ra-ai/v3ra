import { prisma } from "@/lib/database";
import { V3RAPointsService } from "@/lib/services/v3ra-points";

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
        updatedAt: new Date(),
      },
    });

    // Initialize V3RA points for new user
    await V3RAPointsService.getUserPoints(userId);

    return { success: true, user: newUser };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}