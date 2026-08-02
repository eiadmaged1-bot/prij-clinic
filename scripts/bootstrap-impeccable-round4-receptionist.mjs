import {
  DEMO_PASSWORD,
  demoUsers,
  disconnectTestPrisma,
  login
} from "./security-route-manifest.mjs";

try {
  await login(demoUsers.reception, DEMO_PASSWORD);
  console.log("Synthetic Round 4 receptionist fixture ready.");
} finally {
  await disconnectTestPrisma();
}
