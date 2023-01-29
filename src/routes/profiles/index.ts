import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import * as uuid from 'uuid';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { isValidPatchedData } from '../../utils/helpers';

const requiredFields = [
  'avatar',
  'sex',
  'birthday',
  'country',
  'street',
  'city',
  'userId',
  'memberTypeId',
];

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    return await fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id } = request.params;

      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: id,
      });

      if (profile === null) {
        throw fastify.httpErrors.notFound();
      }
      return profile;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { userId, memberTypeId } = request.body;

      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      });

      const profile = await fastify.db.profiles.findOne({
        key: 'userId',
        equals: userId,
      });

      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: memberTypeId,
      });

      if (!user || !memberType || profile) {
        throw fastify.httpErrors.badRequest();
      }

      return await fastify.db.profiles.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply) : Promise<ProfileEntity> {
      const { id } = request.params;

      if (!uuid.validate(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const profile = await fastify.db.profiles.findOne({ key: 'id', equals: id });

      if (profile === null) {
        throw fastify.httpErrors.notFound();
      }

      await fastify.db.profiles.delete(id);
      return profile;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id } = request.params;

      if (!uuid.validate(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const dataToUpdate = request.body;

      if (!isValidPatchedData(dataToUpdate, requiredFields)) {
        throw fastify.httpErrors.badRequest();
      }

      const profile = await fastify.db.profiles.findOne({ key: 'id', equals: id });

      if (profile === null) {
        throw fastify.httpErrors.notFound();
      }

      return await fastify.db.profiles.change(id, dataToUpdate);
    }
  );
};

export default plugin;
