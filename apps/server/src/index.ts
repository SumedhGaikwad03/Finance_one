import "dotenv/config";
import app from "./app";
import prisma from "./lib/prisma";

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Finance One server running on port ${PORT}`);
});

const handleShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("Database connection closed cleanly.");
      process.exit(0);
    } catch (err) {
      console.error("Error during graceful database disconnection:", err);
      process.exit(1);
    }
  });

  // Force shutdown if cleanup takes longer than 10 seconds
  setTimeout(() => {
    console.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));