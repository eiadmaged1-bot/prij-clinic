import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { DirectConversationDto, SendStaffMessageDto } from "./dto";
import { StaffChatService } from "./staff-chat.service";

@Controller("staff-chat")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StaffChatController {
  constructor(private readonly chat: StaffChatService) {}

  @Get("directory")
  @Permissions("staff_chat.read")
  directory(@CurrentUser() user: AuthUser) {
    return this.chat.directory(user);
  }

  @Get("conversations")
  @Permissions("staff_chat.read")
  conversations(@CurrentUser() user: AuthUser) {
    return this.chat.conversations(user);
  }

  @Get("unread-count")
  @Permissions("staff_chat.read")
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.chat.unreadCount(user);
  }

  @Post("direct")
  @Permissions("staff_chat.write")
  direct(@Body() dto: DirectConversationDto, @CurrentUser() user: AuthUser) {
    return this.chat.direct(dto, user);
  }

  @Get("conversations/:conversationId/messages")
  @Permissions("staff_chat.read")
  messages(@Param("conversationId") conversationId: string, @CurrentUser() user: AuthUser) {
    return this.chat.messages(conversationId, user);
  }

  @Post("conversations/:conversationId/messages")
  @Permissions("staff_chat.write")
  send(@Param("conversationId") conversationId: string, @Body() dto: SendStaffMessageDto, @CurrentUser() user: AuthUser) {
    return this.chat.send(conversationId, dto, user);
  }

  @Post("conversations/:conversationId/seen")
  @Permissions("staff_chat.read")
  seen(@Param("conversationId") conversationId: string, @CurrentUser() user: AuthUser) {
    return this.chat.markSeen(conversationId, user);
  }
}
