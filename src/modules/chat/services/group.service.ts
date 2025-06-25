import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group } from '../models/group.model';
import { UserDocument } from 'src/modules/auth/model/user.model';
import { Message, MessageDocument } from '../models/message.model';
import { User } from 'src/modules/auth/model/user.model';
import { Chat } from '../models/chat.model';
import { Server, Socket } from 'socket.io';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<Group>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
  ) {}

  async addMember(groupId: string, userId: string): Promise<Group> {
    const group = await this.groupModel.findById(groupId);
    const user = await this.userModel.findById(userId);
    if (!group || !user) throw new BadRequestException('Группа не найдена');
    if (!group.members.includes(user)) {
      group.members.push(user);
      await group.save();
    }
    return group;
  }

  async sendGroupMessage(
    groupId: string,
    senderId: string,
    content: string,
  ): Promise<MessageDocument> {
    const message = await this.messageModel.create({
      sender: senderId,
      content,
      group: groupId,
    });
    await this.groupModel.findByIdAndUpdate(groupId, {
      $push: { messages: message._id },
    });
    return message;
  }

  async findGroupById(groupId: string) {
    return await this.groupModel.findById(groupId);
  }

  async createGroup(
    name: string,
    members: string[],
    user: User,
  ): Promise<Group> {
    const newGroup = new this.groupModel({
      name,
      members: [...members, user],
      messages: [],
    });
    return newGroup.save();
  }

  async isMember(groupId: string, user: User): Promise<boolean> {
    const group = await this.groupModel.findById(groupId);
    if (!group) return false;
    return group.members.some((m) => m.equals(user.id));
  }

  async leaveGroup(groupId: string, user: User): Promise<void> {
    await this.groupModel.findByIdAndUpdate(
      groupId,
      { $pull: { members: user } },
      { new: true },
    );
  }

  async inviteMember(
    groupId: string,
    inviterId: string,
    receiverId: string,
  ): Promise<void> {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new Error('Group not found');

    const receiver = await this.userModel.findById(receiverId);
    if (!receiver) throw new Error('Receiver not found');

    await this.groupModel.findByIdAndUpdate(groupId, {
      $push: { members: receiver._id },
    });
  }

  async getGroup(groupId: string): Promise<Group | null> {
    return this.groupModel.findById(groupId);
  }

  async getUserGroups(user: User): Promise<Group[]> {
    return this.groupModel.find({ members: user.id });
  }

  async getGroupMessages(groupId: string): Promise<Message[]> {
    return this.messageModel.find({ group: groupId });
  }

  async getOrCreateChat(userId1: string, userId2: string): Promise<Chat> {
    const participants = [userId1, userId2].sort();
    const chat = await this.chatModel.findOne({ participants });
    if (chat) return chat;

    const newChat = new this.chatModel({
      participants,
      messages: [],
    });
    return newChat.save();
  }

  async sendPersonalMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<MessageDocument> {
    const chat = await this.getOrCreateChat(senderId, receiverId);
    const message = await this.messageModel.create({
      sender: senderId,
      content,
      chat: chat._id,
    });
    await this.chatModel.findByIdAndUpdate(chat._id, {
      $push: { messages: message._id },
    });
    return message;
  }

  findSocketById(userId: string, server: Server): Socket | undefined {
    return Array.from(server.sockets.sockets.values()).find(
      (socket) => socket.data.user?._id?.toString() === userId,
    );
  }

  async removeMember(
    groupId: string,
    member: UserDocument | null,
  ): Promise<void> {
    await this.groupModel.findByIdAndUpdate(
      groupId,
      { $pull: { members: member?.id } },
      { new: true },
    );
  }
}
