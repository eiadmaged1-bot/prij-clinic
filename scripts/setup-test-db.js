const fs = require('fs');
const { execSync } = require('child_process');

const envStr = fs.readFileSync('.env', 'utf8');
const match = envStr.match(/DATABASE_URL=(.*)/);
if (match) {
    const url = match[1].trim();
    // Use URL object to safely replace the pathname
    const parsedUrl = new URL(url);
    parsedUrl.pathname = '/prij_clinic_test_cfdf4c0';
    const newUrl = parsedUrl.toString();

    // Set the environment variable
    process.env.DATABASE_URL = newUrl;

    try {
        console.log("Pushing schema to test database...");
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: 'apps/api' });
        console.log("Test database successfully setup!");
    } catch (e) {
        console.error("Failed to setup test database:", e.message);
        process.exit(1);
    }
} else {
    console.error("DATABASE_URL not found");
}
