import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceEncounter, assertCanReferencePatient, assertCanReferenceQueueTicket } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { DirectConversationDto, SendStaffMessageDto } from "./dto";

@Injectable()
export class StaffChatService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async directory(user: AuthUser) {
    const allowedRoles = user.roles.includes("Accountant") ? ["Owner", "Admin", "Receptionist"] : ["Owner", "Admin", "Doctor", "Receptionist"];
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: user.id },
        status: "active",
        ...branchScope(user),
        userRoles: { some: { role: { name: { in: allowedRoles } } } }
      },
      select: { id: true, displayName: true, doctorColor: true, doctorShortLabel: true, userRoles: { select: { role: { select: { name: true } } } } },
      orderBy: { displayName: "asc" }
    });
    return { staff: users.map((staff) => ({ ...staff, roles: staff.userRoles.map((role) => role.role.name), userRoles: undefined })) };
  }

  async conversations(user: AuthUser) {
    const conversations = await this.prisma.staffConversation.findMany({
      where: participantWhere(user),
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, include: { receipts: true, sender: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 50
    });
    return { conversations: conversations.map((conversation) => summarizeConversation(conversation, user.id)) };
  }

  async unreadCount(user: AuthUser) {
    const count = await this.prisma.staffMessageReceipt.count({
      where: {
        userId: user.id,
        seenAt: null,
        message: { senderUserId: { not: user.id }, conversation: participantWhere(user) }
      }
    });
    return { unreadCount: count };
  }

  async direct(dto: DirectConversationDto, user: AuthUser) {
    await this.ensureCanMessageUser(dto.userId, user);
    await this.assertLinkedAccess(dto, user);
    const participantIds = [user.id, dto.userId].sort();
    const existing = await this.prisma.staffConversation.findFirst({
      where: {
        kind: "direct",
        participants: { every: { userId: { in: participantIds } } },
        AND: participantIds.map((id) => ({ participants: { some: { userId: id } } }))
      },
      include: { participants: true }
    });
    if (existing && existing.participants.length === 2) return { conversation: existing };

    const conversation = await this.prisma.staffConversation.create({
      data: {
        kind: "direct",
        patientId: dto.patientId ?? null,
        queueTicketId: dto.queueTicketId ?? null,
        encounterId: dto.encounterId ?? null,
        participants: {
          create: participantIds.map((id) => ({
            userId: id,
            roleSnapshot: id === user.id ? user.roles[0] ?? null : null
          }))
        }
      },
      include: { participants: true }
    });
    return { conversation };
  }

  async messages(conversationId: string, user: AuthUser) {
    await this.requireParticipant(conversationId, user);
    await this.markSeen(conversationId, user);
    const messages = await this.prisma.staffMessage.findMany({
      where: { conversationId, deletedAt: null },
      include: { sender: true, receipts: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
      take: 200
    });
    return { messages: messages.map((message) => summarizeMessage(message, user.id)) };
  }

  async send(conversationId: string, dto: SendStaffMessageDto, user: AuthUser) {
    const conversation = await this.requireParticipant(conversationId, user);
    await this.assertLinkedAccess(dto, user);
    const body = cleanBody(dto.body);
    if (!body) throw new BadRequestException("Message is required.");

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.staffMessage.create({
        data: {
          conversationId,
          senderUserId: user.id,
          body,
          patientId: dto.patientId ?? conversation.patientId,
          queueTicketId: dto.queueTicketId ?? conversation.queueTicketId,
          encounterId: dto.encounterId ?? conversation.encounterId
        }
      });
      const recipients = conversation.participants.filter((participant) => participant.userId !== user.id);
      if (recipients.length > 0) {
        await tx.staffMessageReceipt.createMany({
          data: recipients.map((participant) => ({ messageId: created.id, userId: participant.userId, deliveredAt: new Date() })),
          skipDuplicates: true
        });
      }
      await tx.staffConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      return created;
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "staff_chat.message_sent",
      resourceType: "staff_message",
      resourceId: message.id,
      branchId: user.branchId,
      severity: dto.patientId || conversation.patientId ? "medium" : "low",
      metadataJson: { conversationId, patientLinked: Boolean(dto.patientId || conversation.patientId) }
    });
    return { message };
  }

  async markSeen(conversationId: string, user: AuthUser) {
    await this.requireParticipant(conversationId, user);
    const result = await this.prisma.staffMessageReceipt.updateMany({
      where: { userId: user.id, seenAt: null, message: { conversationId, senderUserId: { not: user.id } } },
      data: { seenAt: new Date() }
    });
    return { markedSeen: result.count };
  }

  private async requireParticipant(conversationId: string, user: AuthUser) {
    const conversation = await this.prisma.staffConversation.findFirst({
      where: { id: conversationId, ...participantWhere(user) },
      include: { participants: true }
    });
    if (!conversation) throw new NotFoundException("Conversation not found.");
    return conversation;
  }

  private async ensureCanMessageUser(targetUserId: string, user: AuthUser) {
    if (targetUserId === user.id) throw new BadRequestException("Choose another staff member.");
    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, status: "active", ...branchScope(user) },
      include: { userRoles: { include: { role: true } } }
    });
    if (!target) throw new NotFoundException("Staff member not found.");
    const targetRoles = target.userRoles.map((role) => role.role.name);
    const clinicalLink = user.roles.some((role) => ["Owner", "Admin", "Doctor", "Receptionist"].includes(role));
    if (!clinicalLink || (user.roles.includes("Accountant") && targetRoles.includes("Doctor"))) {
      throw new ForbiddenException("Chat access is restricted for this staff pair.");
    }
  }

  private async assertLinkedAccess(input: { patientId?: string; queueTicketId?: string; encounterId?: string }, user: AuthUser) {
    if ((input.patientId || input.queueTicketId || input.encounterId) && !user.permissions.includes("staff_chat.patient_link")) {
      throw new ForbiddenException("Patient-linked staff messages require clinical access.");
    }
    if (input.patientId) await assertCanReferencePatient(this.prisma, input.patientId, user);
    if (input.queueTicketId) await assertCanReferenceQueueTicket(this.prisma, input.queueTicketId, user);
    await assertCanReferenceEncounter(this.prisma, input.encounterId, user, { patientId: input.patientId, requireDoctorScope: false });
  }
}

function participantWhere(user: AuthUser): Prisma.StaffConversationWhereInput {
  if (user.permissions.includes("staff_chat.oversight")) return {};
  return { participants: { some: { userId: user.id } } };
}

function cleanBody(body: string) {
  return body.trim().replace(/[<>]/g, "").slice(0, 2000);
}

function summarizeConversation(conversation: Prisma.StaffConversationGetPayload<{ include: { participants: { include: { user: true } }; messages: { include: { receipts: true; sender: true } } } }>, currentUserId: string) {
  const otherParticipants = conversation.participants.filter((participant) => participant.userId !== currentUserId);
  const latest = conversation.messages[0] ?? null;
  return {
    id: conversation.id,
    kind: conversation.kind,
    title: conversation.title ?? (otherParticipants.map((participant) => participant.user.displayName).join(", ") || "Staff conversation"),
    patientId: conversation.patientId,
    queueTicketId: conversation.queueTicketId,
    encounterId: conversation.encounterId,
    updatedAt: conversation.updatedAt,
    participants: conversation.participants.map((participant) => ({ userId: participant.userId, displayName: participant.user.displayName })),
    latestMessage: latest ? summarizeMessage(latest, currentUserId) : null
  };
}

function summarizeMessage(message: Prisma.StaffMessageGetPayload<{ include: { sender: true; receipts: { include?: { user: true } } } }>, currentUserId: string) {
  const receipts = message.receipts ?? [];
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderUserId: message.senderUserId,
    senderName: message.sender.displayName,
    body: message.body,
    patientId: message.patientId,
    queueTicketId: message.queueTicketId,
    encounterId: message.encounterId,
    createdAt: message.createdAt,
    seenStatus: message.senderUserId === currentUserId
      ? seenSummary(receipts as Array<{ seenAt: Date | null; user?: { displayName: string } }>)
      : (receipts.some((receipt) => receipt.userId === currentUserId && receipt.seenAt) ? "Seen" : "Unread")
  };
}

function seenSummary(receipts: Array<{ seenAt: Date | null; user?: { displayName: string } }>) {
  const seen = receipts.filter((receipt) => receipt.seenAt);
  if (receipts.length <= 1) return seen[0]?.seenAt ? `Seen at ${seen[0].seenAt.toLocaleTimeString()}` : "Sent";
  return `Seen by ${seen.length}/${receipts.length}`;
}
