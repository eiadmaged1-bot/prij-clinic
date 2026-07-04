process.env.APP_ENV = "staging";
process.env.AI_PROVIDER = process.env.AI_PROVIDER || "disabled";

await import("./staging-smoke-test.mjs");
