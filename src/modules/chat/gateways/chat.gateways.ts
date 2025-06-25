import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/modules/auth/model/user.model';
import { Group } from '../models/group.model';
import { Message, MessageDocument } from '../models/message.model';
import { JwtService } from '@nestjs/jwt';
import { SocketData } from '../interfaces/types/gateway.type';
import { Chat } from '../models/chat.model';
import { GroupService } from '../services/group.service';
import { BadGatewayException } from '@nestjs/common';

@WebSocketGateway({ cors: '*', namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Group.name) private groupModel: Model<Group>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
    private jwt: JwtService,
    private groupService: GroupService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake?.query.token as string;
    if (!token) {
      client.disconnect(true);
      return;
    }

    const userId = this.decodeToken(token);
    if (!userId) {
      client.disconnect(true);
      return;
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      client.disconnect(true);
      return;
    }

    client.emit('userConnected', user);

    const socketData = client.data as SocketData;
    socketData.user = user;

    const groups = await this.groupModel.find({ members: user._id });

    const chats = await this.chatModel.find({
      participants: { $in: [user._id] },
    });

    await Promise.all([
      ...groups.map(async (group) => {
        const roomId = `group_${group._id}`;
        await client.join(roomId);
        await this.sendHistory(client, roomId);
      }),
      ...chats.map(async (chat) => {
        const roomId = `chat_${chat._id}`;
        await client.join(roomId);
        await this.sendHistory(client, roomId);
      }),
    ]);
  }

  async handleDisconnect(client: Socket) {
    const rooms = Array.from(client.rooms);

    await Promise.all(
      rooms.map(async (room) => {
        await client.leave(room);
      }),
    );
  }

  @SubscribeMessage('createGroup')
  async handleCreateGroup(
    client: Socket,
    payload: { name: string; members: string[] },
  ): Promise<void> {
    const socketData = client.data as SocketData;
    const user = socketData.user;
    if (!user) {
      throw new BadGatewayException('Unauthorized');
    }

    try {
      const newGroup = await this.groupService.createGroup(
        payload.name,
        payload.members,
        user,
      );
      client.join(`group_${newGroup._id}`);
      this.server.emit('groupCreated', newGroup);
    } catch (error) {
      throw new BadGatewayException(error.message);
    }
  }

  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    client: Socket,
    payload: { groupId: string },
  ): Promise<void> {
    const socketData = client.data as SocketData;
    const user = socketData.user;
    if (!user) return;

    const { groupId } = payload;

    try {
      const isMember = await this.groupService.isMember(groupId, user);
      if (!isMember) {
        throw new BadGatewayException('You are not a member');
      }

      client.join(`group_${groupId}`);
      this.server.to(`group_${groupId}`).emit('userJoined', user);
    } catch (error) {
      throw new BadGatewayException(error.message);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: Socket,
    payload: { receiverId?: string; groupId?: string; content: string },
  ): Promise<void> {
    const socketData = client.data as SocketData;
    const user = socketData.user;

    if (!user) {
      throw new BadGatewayException('Unauthorized');
    }

    const { receiverId, groupId, content } = payload;

    if (!content) {
      throw new BadGatewayException('Content is required');
    }

    let message: MessageDocument;
    let roomId: string;

    try {
      if (groupId) {
        const isMember = await this.groupService.isMember(groupId, user);
        if (!isMember) {
          throw new BadGatewayException('You are not a member of this group');
        }

        message = await this.groupService.sendGroupMessage(
          groupId,
          user.id,
          content,
        );
        roomId = `group_${groupId}`;
      } else if (receiverId) {
        const chat = await this.groupService.getOrCreateChat(
          user.id,
          receiverId,
        );
        message = await this.groupService.sendPersonalMessage(
          user.id,
          receiverId,
          content,
        );
        roomId = `chat_${chat._id}`;
      } else {
        throw new BadGatewayException('No receiver or group specified');
      }

      this.updateSocketRooms(client, roomId);
      this.broadcastMessage(client, roomId, message);

      if (receiverId) {
        const receiverSocket = this.groupService.findSocketById(
          receiverId,
          this.server,
        );
        receiverSocket?.join(roomId);
      }
    } catch (error) {
      throw new BadGatewayException(error.message);
    }
  }

  @SubscribeMessage('inviteInGroup')
  async handleInviteInGroup(
    client: Socket,
    payload: { receiverId: string; groupId: string },
  ): Promise<void> {
    const socketData = client.data as SocketData;
    const user = socketData.user;
    if (!user) {
      throw new BadGatewayException('Unauthorized');
    }

    try {
      await this.groupService.inviteMember(
        payload.groupId,
        user.id,
        payload.receiverId,
      );

      const group = await this.groupService.getGroup(payload.groupId);
      this.server.to(`group_${payload.groupId}`).emit('userJoined', {
        user: await this.userModel.findById(payload.receiverId),
        action: 'invited',
      });

      const receiverSocket = Array.from(
        this.server.sockets.sockets.values(),
      ).find(
        (socket) => socket.data.user?._id?.toString() === payload.receiverId,
      );
      if (receiverSocket) {
        receiverSocket.join(`group_${payload.groupId}`);
        receiverSocket.emit('groupInvitationAccepted', {
          groupId: payload.groupId,
          groupName: group?.name || '',
        });
      }
    } catch (error) {
      throw new BadGatewayException(error.message);
    }
  }

  @SubscribeMessage('removeFromGroup')
  async handleRemoveMember(
    client: Socket,
    payload: { memberId: string; groupId: string },
  ): Promise<void> {
    const socketData = client.data as SocketData;
    const currentUser = socketData.user;
    if (!currentUser) {
      throw new BadGatewayException('Unauthorized');
    }

    try {
      const { memberId, groupId } = payload;
      const member = await this.userModel.findById(memberId);
      await this.groupService.removeMember(groupId, member);

      const group = await this.groupService.getGroup(groupId);
      this.server.to(`group_${groupId}`).emit('userLeft', {
        user: await this.userModel.findById(member),
        action: 'removed',
      });

      const removedUserSocket = Array.from(
        this.server.sockets.sockets.values(),
      ).find((socket) => socket.data.user?._id?.toString() === memberId);

      if (removedUserSocket) {
        removedUserSocket.leave(`group_${groupId}`);
        removedUserSocket.emit('groupRemoval', {
          groupId: groupId,
          groupName: group?.name || '',
        });
      }
    } catch (error) {
      throw new BadGatewayException(error.message);
    }
  }

  @SubscribeMessage('leaveGroup')
  async handleLeaveGroup(
    client: Socket,
    payload: { groupId: string },
  ): Promise<void> {
    const socketData = client.data as SocketData;
    const user = socketData.user;
    const { groupId } = payload;

    if (!user) {
      throw new BadGatewayException('Unauthorized');
    }

    try {
      await this.groupService.leaveGroup(groupId, user.id);
      client.leave(`group_${groupId}`);
      this.server.to(`group_${groupId}`).emit('userLeft', { userId: user._id });
      client.emit('leftGroup', {
        groupId,
        groupName: (await this.groupService.getGroup(groupId))?.name || '',
      });
    } catch (error) {
      throw new BadGatewayException(error.message);
    }
  }

  private decodeToken(token: string): string | null {
    try {
      const decoded = this.jwt.verify<{ sub: string; email: string }>(token, {
        secret: 'secretKey',
      });
      return decoded.sub;
    } catch {
      return null;
    }
  }

  private async sendHistory(client: Socket, roomId: string) {
    let messages: Message[] = [];
    if (roomId.startsWith('group_')) {
      const groupId = roomId.split('_')[1];
      messages = await this.messageModel.find({ group: groupId });
    } else if (roomId.startsWith('chat_')) {
      const chatId = roomId.split('_')[1];
      messages = await this.messageModel.find({ chat: chatId });
    }
    client.emit('historyLoaded', { roomId, messages });
  }

  private updateSocketRooms(client: Socket, roomId: string) {
    client.join(roomId);
  }

  private broadcastMessage(client: Socket, roomId: string, message: Message) {
    this.server.to(roomId).emit('newMessage', {
      message,
      sender: client.data.user,
    });
  }
}
