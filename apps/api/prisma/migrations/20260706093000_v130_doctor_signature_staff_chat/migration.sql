-- v1.3.0 doctor visit signatures, clinical case library access fields, and internal staff chat.

ALTER TABLE "User"
  ADD COLUMN "doctorColor" TEXT,
  ADD COLUMN "doctorShortLabel" TEXT;

ALTER TABLE "Encounter"
  ADD COLUMN "startedByUserId" UUID,
  ADD COLUMN "doctorDisplayNameSnapshot" TEXT,
  ADD COLUMN "doctorColorSnapshot" TEXT,
  ADD COLUMN "startedAt" TIMESTAMPTZ(3);

ALTER TABLE "Encounter"
  ADD CONSTRAINT "Encounter_startedByUserId_fkey"
  FOREIGN KEY ("startedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Encounter_startedByUserId_startedAt_idx" ON "Encounter"("startedByUserId", "startedAt");

CREATE TABLE "StaffConversation" (
  "id" UUID NOT NULL,
  "title" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'direct',
  "patientId" UUID,
  "queueTicketId" UUID,
  "encounterId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "StaffConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffConversationParticipant" (
  "id" UUID NOT NULL,
  "conversationId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "roleSnapshot" TEXT,
  "joinedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StaffConversationParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffMessage" (
  "id" UUID NOT NULL,
  "conversationId" UUID NOT NULL,
  "senderUserId" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "messageType" TEXT NOT NULL DEFAULT 'text',
  "patientId" UUID,
  "queueTicketId" UUID,
  "encounterId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "editedAt" TIMESTAMPTZ(3),
  "deletedAt" TIMESTAMPTZ(3),

  CONSTRAINT "StaffMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffMessageReceipt" (
  "id" UUID NOT NULL,
  "messageId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "deliveredAt" TIMESTAMPTZ(3),
  "seenAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StaffMessageReceipt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StaffConversation_kind_updatedAt_idx" ON "StaffConversation"("kind", "updatedAt");
CREATE INDEX "StaffConversation_patientId_idx" ON "StaffConversation"("patientId");
CREATE INDEX "StaffConversation_queueTicketId_idx" ON "StaffConversation"("queueTicketId");
CREATE INDEX "StaffConversation_encounterId_idx" ON "StaffConversation"("encounterId");

CREATE UNIQUE INDEX "StaffConversationParticipant_conversationId_userId_key" ON "StaffConversationParticipant"("conversationId", "userId");
CREATE INDEX "StaffConversationParticipant_userId_idx" ON "StaffConversationParticipant"("userId");

CREATE INDEX "StaffMessage_conversationId_createdAt_idx" ON "StaffMessage"("conversationId", "createdAt");
CREATE INDEX "StaffMessage_senderUserId_createdAt_idx" ON "StaffMessage"("senderUserId", "createdAt");
CREATE INDEX "StaffMessage_patientId_idx" ON "StaffMessage"("patientId");

CREATE UNIQUE INDEX "StaffMessageReceipt_messageId_userId_key" ON "StaffMessageReceipt"("messageId", "userId");
CREATE INDEX "StaffMessageReceipt_userId_seenAt_idx" ON "StaffMessageReceipt"("userId", "seenAt");

ALTER TABLE "StaffConversation"
  ADD CONSTRAINT "StaffConversation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "StaffConversation_queueTicketId_fkey" FOREIGN KEY ("queueTicketId") REFERENCES "QueueTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "StaffConversation_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StaffConversationParticipant"
  ADD CONSTRAINT "StaffConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "StaffConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "StaffConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StaffMessage"
  ADD CONSTRAINT "StaffMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "StaffConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "StaffMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "StaffMessage_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "StaffMessage_queueTicketId_fkey" FOREIGN KEY ("queueTicketId") REFERENCES "QueueTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "StaffMessage_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StaffMessageReceipt"
  ADD CONSTRAINT "StaffMessageReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "StaffMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "StaffMessageReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
