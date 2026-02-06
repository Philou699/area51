import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import type { CreateAreaDto } from './dto/create-area.dto';
import type { UpdateAreaStatusDto } from './dto/update-area-status.dto';
import type { UpdateAreaDto } from './dto/update-area.dto';
import type { AreaResponseDto } from './dto/area-response.dto';

const areaIncludes = Prisma.validator<Prisma.AreaInclude>()({
  action: {
    include: {
      service: true,
    },
  },
  reaction: {
    include: {
      service: true,
    },
  },
});

type AreaWithRelations = Prisma.AreaGetPayload<{
  include: typeof areaIncludes;
}>;

@Injectable()
export class AreasService {
  constructor(private readonly database: DatabaseService) {}

  async create(userId: number, dto: CreateAreaDto): Promise<AreaResponseDto> {
    const [action, reaction] = await Promise.all([
      this.database.action.findUnique({
        where: { id: dto.actionId },
        include: { service: true },
      }),
      this.database.reaction.findUnique({
        where: { id: dto.reactionId },
        include: { service: true },
      }),
    ]);

    if (!action || !action.service.enabled) {
      throw new BadRequestException('Action invalide');
    }

    if (!reaction || !reaction.service.enabled) {
      throw new BadRequestException('Réaction invalide');
    }

    const area = await this.database.area.create({
      data: {
        name: dto.name,
        userId,
        actionId: action.id,
        reactionId: reaction.id,
        actionConfig:
          dto.actionConfig !== undefined
            ? (dto.actionConfig as Prisma.JsonObject)
            : undefined,
        reactionConfig:
          dto.reactionConfig !== undefined
            ? (dto.reactionConfig as Prisma.JsonObject)
            : undefined,
        dedupKeyStrategy: dto.dedupKeyStrategy ?? undefined,
      },
      include: AreasService.areaIncludes,
    });

    return AreasService.mapArea(area);
  }

  async findForUser(userId: number): Promise<AreaResponseDto[]> {
    const areas = await this.database.area.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: AreasService.areaIncludes,
    });

    return areas.map((area) => AreasService.mapArea(area));
  }

  async updateStatus(
    userId: number,
    areaId: number,
    dto: UpdateAreaStatusDto,
  ): Promise<AreaResponseDto> {
    await this.assertAreaOwnership(userId, areaId);

    const area = await this.database.area.update({
      where: { id: areaId },
      data: { enabled: dto.enabled },
      include: AreasService.areaIncludes,
    });

    return AreasService.mapArea(area);
  }

  async update(
    userId: number,
    areaId: number,
    dto: UpdateAreaDto,
  ): Promise<AreaResponseDto> {
    const existing = await this.database.area.findUnique({
      where: { id: areaId },
      include: AreasService.areaIncludes,
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Area not found');
    }

    let actionId = existing.actionId;
    if (dto.actionId !== undefined && dto.actionId !== existing.actionId) {
      const action = await this.database.action.findUnique({
        where: { id: dto.actionId },
        include: { service: true },
      });
      if (!action || !action.service.enabled) {
        throw new BadRequestException('Action invalide');
      }
      actionId = action.id;
    }

    let reactionId = existing.reactionId;
    if (dto.reactionId !== undefined && dto.reactionId !== existing.reactionId) {
      const reaction = await this.database.reaction.findUnique({
        where: { id: dto.reactionId },
        include: { service: true },
      });
      if (!reaction || !reaction.service.enabled) {
        throw new BadRequestException('Réaction invalide');
      }
      reactionId = reaction.id;
    }

    const updateData: Prisma.AreaUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (actionId !== existing.actionId) {
      updateData.action = {
        connect: { id: actionId },
      };
      if (dto.actionConfig === undefined) {
        updateData.actionConfig = {} as Prisma.JsonObject;
      }
    }

    if (reactionId !== existing.reactionId) {
      updateData.reaction = {
        connect: { id: reactionId },
      };
      if (dto.reactionConfig === undefined) {
        updateData.reactionConfig = {} as Prisma.JsonObject;
      }
    }

    if (dto.actionConfig !== undefined) {
      updateData.actionConfig = dto.actionConfig as Prisma.JsonObject;
    }

    if (dto.reactionConfig !== undefined) {
      updateData.reactionConfig = dto.reactionConfig as Prisma.JsonObject;
    }

    if (dto.dedupKeyStrategy !== undefined) {
      updateData.dedupKeyStrategy =
        dto.dedupKeyStrategy ?? null;
    }

    if (Object.keys(updateData).length === 0) {
      return AreasService.mapArea(existing);
    }

    const updated = await this.database.area.update({
      where: { id: areaId },
      data: updateData,
      include: AreasService.areaIncludes,
    });

    return AreasService.mapArea(updated);
  }

  async remove(userId: number, areaId: number): Promise<void> {
    await this.assertAreaOwnership(userId, areaId);
    await this.database.area.delete({ where: { id: areaId } });
  }

  private async assertAreaOwnership(
    userId: number,
    areaId: number,
  ): Promise<void> {
    const area = await this.database.area.findUnique({
      where: { id: areaId },
      select: { userId: true },
    });

    if (!area || area.userId !== userId) {
      throw new NotFoundException('Area not found');
    }
  }

  private static readonly areaIncludes = areaIncludes;

  private static mapArea(area: AreaWithRelations): AreaResponseDto {
    return {
      id: area.id,
      name: area.name,
      enabled: area.enabled,
      actionConfig:
        (area.actionConfig as Record<string, unknown> | null) ?? null,
      reactionConfig:
        (area.reactionConfig as Record<string, unknown> | null) ?? null,
      dedupKeyStrategy: area.dedupKeyStrategy ?? null,
      createdAt: area.createdAt.toISOString(),
      action: {
        id: area.action.id,
        key: area.action.key,
        description: area.action.description,
        configSchema: area.action.configSchema,
        service: {
          id: area.action.service.id,
          slug: area.action.service.slug,
          name: area.action.service.name,
        },
      },
      reaction: {
        id: area.reaction.id,
        key: area.reaction.key,
        description: area.reaction.description,
        configSchema: area.reaction.configSchema,
        service: {
          id: area.reaction.service.id,
          slug: area.reaction.service.slug,
          name: area.reaction.service.name,
        },
      },
    };
  }
}
