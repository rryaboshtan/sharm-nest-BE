import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ILike, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleUserDto } from './dto/update-role-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existUser) throw new BadRequestException('User already exist');

    const user = new User(createUserDto);
    user.password = await argon2.hash(createUserDto.password);

    const createdUser = await this.userRepository.save(user);

    const token = this.jwtService.sign({
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
    });

    return {
      user: createdUser,
      token,
    };
  }

  async findOne(email: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { email: email } });
  }

  async findById(id: number, req: any): Promise<User | undefined> {
    const userToBeDeletedId = req.user.role === 'admin' ? id : req.user.id;
    const updatedUser = await this.userRepository.findOne({
      where: { id: userToBeDeletedId },
    });
    return updatedUser;
  }

  async findAll(page: number, limit: number) {
    const users = await this.userRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    const count = await this.userRepository.count();

    return {
      data: users,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
    req: any,
  ): Promise<User> {
    const userToBeDeletedId = req.user.role === 'admin' ? userId : req.user.id;
    const updatedUser = await this.userRepository.findOne({
      where: { id: userToBeDeletedId },
    });

    if (!updatedUser) throw new BadRequestException('User not found');

    await this.userRepository.update(userId, updateUserDto);

    return updatedUser;
  }

  async deleteUser(userId: number, req: any): Promise<User | boolean> {
    //  const userToBeDeletedId = req.user.role === "admin" ? userId : req.user.id;
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) throw new BadRequestException('User not found');

    await this.userRepository.delete(userId);

    return true;
  }

  async updateRole(
    updateRoleUserDto: UpdateRoleUserDto,
    userId: number,
    req: any,
  ): Promise<User | boolean> {
    // const userToBeDeletedId = req.user.role === "admin" ? userId : null;
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) throw new BadRequestException('User not found');

    user.role = updateRoleUserDto.role;

    await this.userRepository.save(user);

    return user;
  }

  async searchByField(field: string, value: string): Promise<any[]> {
    const validFields = ['name', 'surname', 'email', 'phone', 'role'];
    if (!validFields.includes(field)) {
      throw new BadRequestException('Invalid search field');
    }

    const whereCondition = {};
    whereCondition[field] = ILike(`%${value}%`);

    const users = await this.userRepository.find({ where: whereCondition });

    return users;
  }
}
