const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://prij_clinic_dev:prij_clinic_dev_password@localhost:5432/prij_clinic_test_cfdf4c0?schema=public" } } });
async function run() {
    const users = await prisma.user.findMany();
    console.log(users.map(u => ({ id: u.id, email: u.email, loginId: u.loginId })));
}
run().catch(console.error).finally(() => prisma.$disconnect());
