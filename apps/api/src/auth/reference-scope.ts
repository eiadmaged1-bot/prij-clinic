import { NotFoundException } from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";
import type { AuthUser } from "./auth.types";
import { EMPTY_SCOPE_ID, isDoctor, isOwnerOrAdmin } from "./scope";

type PrismaLike = Pick<
  PrismaClient,
  | "patient"
  | "user"
  | "appointment"
  | "queueTicket"
  | "encounter"
  | "prescription"
  | "investigationOrder"
  | "report"
  | "pregnancy"
  | "obUltrasound"
  | "invoice"
  | "payment"
  | "aiDraft"
>;

export function actorBranchId(user: AuthUser) {
  return user.branchId ?? EMPTY_SCOPE_ID;
}

export function branchAllowed(user: AuthUser, branchId?: string | null) {
  return isOwnerOrAdmin(user) || branchId === user.branchId;
}

export function doctorAllowed(user: AuthUser, doctorId?: string | null) {
  return !isDoctor(user) || isOwnerOrAdmin(user) || doctorId === user.id;
}

export async function assertCanReferencePatient(prisma: PrismaLike, patientId: string, user: AuthUser) {
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      ...(isOwnerOrAdmin(user) ? {} : { branchId: actorBranchId(user) })
    }
  });

  if (!patient) {
    throw new NotFoundException("Referenced patient not found.");
  }

  return patient;
}

export async function assertCanReferenceUserInBranch(prisma: PrismaLike, userId: string | undefined, actor: AuthUser, branchId?: string | null) {
  if (!userId) return null;

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      status: "active",
      ...(isOwnerOrAdmin(actor) ? {} : { branchId: branchId ?? actorBranchId(actor) })
    }
  });

  if (!user) {
    throw new NotFoundException("Referenced staff user not found.");
  }

  return user;
}

export async function assertCanReferenceAppointment(
  prisma: PrismaLike,
  appointmentId: string | undefined,
  user: AuthUser,
  options: { patientId?: string; requireDoctorScope?: boolean } = {}
) {
  if (!appointmentId) return null;

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      ...(isOwnerOrAdmin(user) ? {} : { branchId: actorBranchId(user) }),
      ...(options.requireDoctorScope && isDoctor(user) && !isOwnerOrAdmin(user) ? { doctorId: user.id } : {})
    }
  });

  if (!appointment || (options.patientId && appointment.patientId !== options.patientId)) {
    throw new NotFoundException("Referenced appointment not found.");
  }

  return appointment;
}

export async function assertCanReferenceQueueTicket(prisma: PrismaLike, queueTicketId: string, user: AuthUser) {
  const ticket = await prisma.queueTicket.findFirst({
    where: {
      id: queueTicketId,
      ...(isOwnerOrAdmin(user) ? {} : { branchId: actorBranchId(user) })
    }
  });

  if (!ticket) {
    throw new NotFoundException("Referenced queue ticket not found.");
  }

  return ticket;
}

export async function assertCanReferenceEncounter(
  prisma: PrismaLike,
  encounterId: string | undefined,
  user: AuthUser,
  options: { patientId?: string; requireDoctorScope?: boolean } = {}
) {
  if (!encounterId) return null;

  const encounter = await prisma.encounter.findFirst({
    where: {
      id: encounterId,
      ...(isOwnerOrAdmin(user) ? {} : { patient: { branchId: actorBranchId(user) } }),
      ...(options.requireDoctorScope && isDoctor(user) && !isOwnerOrAdmin(user) ? { doctorId: user.id } : {})
    }
  });

  if (!encounter || (options.patientId && encounter.patientId !== options.patientId)) {
    throw new NotFoundException("Referenced encounter not found.");
  }

  return encounter;
}

export async function assertCanReferenceInvestigationOrder(
  prisma: PrismaLike,
  investigationOrderId: string | undefined,
  user: AuthUser,
  options: { patientId?: string; requireDoctorScope?: boolean } = {}
) {
  if (!investigationOrderId) return null;

  const order = await prisma.investigationOrder.findFirst({
    where: {
      id: investigationOrderId,
      ...(isOwnerOrAdmin(user) ? {} : { patient: { branchId: actorBranchId(user) } }),
      ...(options.requireDoctorScope && isDoctor(user) && !isOwnerOrAdmin(user) ? { doctorId: user.id } : {})
    }
  });

  if (!order || (options.patientId && order.patientId !== options.patientId)) {
    throw new NotFoundException("Referenced investigation order not found.");
  }

  return order;
}

export async function assertCanReferencePregnancy(
  prisma: PrismaLike,
  pregnancyId: string | undefined,
  user: AuthUser,
  options: { patientId?: string } = {}
) {
  if (!pregnancyId) return null;

  const pregnancy = await prisma.pregnancy.findFirst({
    where: {
      id: pregnancyId,
      ...(isOwnerOrAdmin(user) ? {} : { branchId: actorBranchId(user) })
    }
  });

  if (!pregnancy || (options.patientId && pregnancy.patientId !== options.patientId)) {
    throw new NotFoundException("Referenced pregnancy not found.");
  }

  return pregnancy;
}

export async function assertCanReferenceInvoice(prisma: PrismaLike, invoiceId: string, user: AuthUser) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      ...(isOwnerOrAdmin(user) ? {} : { branchId: actorBranchId(user) })
    },
    include: { items: true, payments: true, patient: true }
  });

  if (!invoice) {
    throw new NotFoundException("Referenced invoice not found.");
  }

  return invoice;
}

export async function assertCanReferencePayment(prisma: PrismaLike, paymentId: string, user: AuthUser) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      ...(isOwnerOrAdmin(user) ? {} : { branchId: actorBranchId(user) })
    },
    include: { patient: true, invoice: true }
  });

  if (!payment) {
    throw new NotFoundException("Referenced payment not found.");
  }

  return payment;
}

export async function assertCanReferenceAiDraft(prisma: PrismaLike, draftId: string, user: AuthUser) {
  const draft = await prisma.aiDraft.findFirst({
    where: {
      id: draftId,
      ...(isOwnerOrAdmin(user) ? {} : { branchId: actorBranchId(user) })
    }
  });

  if (!draft) {
    throw new NotFoundException("Referenced AI draft not found.");
  }

  return draft;
}
