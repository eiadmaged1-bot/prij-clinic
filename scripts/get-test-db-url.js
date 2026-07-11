const fs = require('fs');
const envStr = fs.readFileSync('.env', 'utf8');
const match = envStr.match(/DATABASE_URL=(.*)/);
if (match) {
    const url = match[1].trim();
    const newUrl = url.replace('prij_clinic_dev', 'prij_clinic_test_cfdf4c0');
    console.log(newUrl);
} else {
    console.error("DATABASE_URL not found");
}
