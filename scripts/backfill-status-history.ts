import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const apps = await prisma.application.findMany({
    select: {
      id: true,
      status: true,
      appliedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  for (const app of apps) {
    const existingHistoryCount = await prisma.applicationStatusHistory.count({
      where: { applicationId: app.id },
    });
    if (existingHistoryCount > 0) continue;

    const baseTime = app.appliedAt ?? app.createdAt ?? app.updatedAt ?? new Date();

    // Initial status from creation/applied time
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: app.id,
        fromStatus: null,
        toStatus: app.status,
        changedAt: baseTime,
      },
    });
  }

  console.log("Backfill complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

