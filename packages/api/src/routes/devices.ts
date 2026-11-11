import {
  ALERT_TIMES,
  type DeviceRequest,
  type DeviceResponse,
  type PushConfigResponse,
} from '@hawa/contracts';
import type { FastifyInstance } from 'fastify';
import { Not, type DataSource } from 'typeorm';
import { Device } from '../db/entities/device.entity.js';

const MAX_TOKEN_LENGTH = 4096;
const MAX_ALERT_SITES = 100;

const idParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
} as const;

const deviceBodySchema = {
  type: 'object',
  required: ['platform', 'token', 'level', 'alertTime', 'alertSiteIds'],
  additionalProperties: false,
  properties: {
    platform: { type: 'string', enum: ['web', 'android', 'ios'] },
    token: { type: 'string', minLength: 1, maxLength: MAX_TOKEN_LENGTH },
    level: { type: 'string', enum: ['student', 'pilot'] },
    alertTime: { type: 'string', enum: [...ALERT_TIMES] },
    alertSiteIds: {
      type: 'array',
      maxItems: MAX_ALERT_SITES,
      uniqueItems: true,
      items: { type: 'string', format: 'uuid' },
    },
  },
} as const;

export interface DeviceRoutesOptions {
  db: DataSource;
  webPushPublicKey: string | null;
}

function toResponse(device: Device): DeviceResponse {
  return {
    id: device.id,
    platform: device.platform,
    level: device.level,
    alertTime: device.alertTime,
    alertSiteIds: device.alertSiteIds,
    createdAt: device.createdAt.toISOString(),
    updatedAt: device.updatedAt.toISOString(),
  };
}

export async function deviceRoutes(
  app: FastifyInstance,
  { db, webPushPublicKey }: DeviceRoutesOptions,
) {
  const devices = db.getRepository(Device);

  app.get('/v1/push/config', async (): Promise<PushConfigResponse> => ({ webPushPublicKey }));

  app.put<{ Params: { id: string }; Body: DeviceRequest }>(
    '/v1/devices/:id',
    { schema: { params: idParamsSchema, body: deviceBodySchema } },
    async (request): Promise<DeviceResponse> => {
      const { id } = request.params;
      const body = request.body;
      const saved = await db.transaction(async (tx) => {
        const repo = tx.getRepository(Device);
        await repo.delete({ token: body.token, id: Not(id) });
        await repo.save({ id, ...body });
        return repo.findOneByOrFail({ id });
      });
      return toResponse(saved);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/v1/devices/:id',
    { schema: { params: idParamsSchema } },
    async (request, reply) => {
      await devices.delete({ id: request.params.id });
      return reply.code(204).send();
    },
  );
}
