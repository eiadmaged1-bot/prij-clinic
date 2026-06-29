-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "serviceItemId" UUID;

-- AlterTable
ALTER TABLE "ServiceItem" ADD COLUMN     "costAmount" DECIMAL(12,2),
ADD COLUMN     "doctorShareAmount" DECIMAL(12,2);

-- CreateIndex
CREATE INDEX "InvoiceItem_serviceItemId_idx" ON "InvoiceItem"("serviceItemId");

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES "ServiceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
