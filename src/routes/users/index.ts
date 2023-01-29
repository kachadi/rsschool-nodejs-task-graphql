import * as uuid from 'uuid';
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;

      const user = await fastify.db.users.findOne({ key: 'id', equals: id });

      if (user === null) {
        throw fastify.httpErrors.notFound();
      }
      return user;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const newUser = await fastify.db.users.create(request.body);
      return newUser;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;

      if (!uuid.validate(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const user = await fastify.db.users.findOne({ key: 'id', equals: id });

      if (user === null) {
        throw fastify.httpErrors.notFound();
      }

      const users = await fastify.db.users.findMany();

      users.forEach(async (el) => {
        if (el.subscribedToUserIds.includes(id)) {
          const updatesubscribedToUserIds = el.subscribedToUserIds.filter(
            (i) => i !== id
          );

          el.subscribedToUserIds = updatesubscribedToUserIds;

          await fastify.db.users.change(el.id, el);
        }
      });

      await fastify.db.users.delete(id);

      return user;
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;

      if (!uuid.validate(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const { userId: userIdWhoWantSubscribe } = request.body;

      const user = await fastify.db.users.findOne({ key: 'id', equals: id });

      if (user === null) {
        throw fastify.httpErrors.notFound();
      }

      const userWhoWantSubscribe = await fastify.db.users.findOne({
        key: 'id',
        equals: userIdWhoWantSubscribe,
      });

      if (userWhoWantSubscribe === null) {
        throw fastify.httpErrors.notFound();
      }

      if (userWhoWantSubscribe.subscribedToUserIds.includes(id)) {
        throw fastify.httpErrors.badRequest();
      }

      userWhoWantSubscribe.subscribedToUserIds.push(id);
      return await fastify.db.users.change(
        userWhoWantSubscribe.id,
        userWhoWantSubscribe
      );
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;

      if (!uuid.validate(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const { userId: userIdWhoWantUnsubscribe } = request.body;
      const user = await fastify.db.users.findOne({ key: 'id', equals: id });

      if (user === null) {
        throw fastify.httpErrors.notFound();
      }

      const userWhoWantUnsubscribe = await fastify.db.users.findOne({
        key: 'id',
        equals: userIdWhoWantUnsubscribe,
      });

      if (userWhoWantUnsubscribe === null) {
        throw fastify.httpErrors.notFound();
      }

      if (!userWhoWantUnsubscribe.subscribedToUserIds.includes(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const updateSubscribedToUserIds =
        userWhoWantUnsubscribe.subscribedToUserIds.filter((el) => el !== id);

      userWhoWantUnsubscribe.subscribedToUserIds = updateSubscribedToUserIds;

      return await fastify.db.users.change(
        userWhoWantUnsubscribe.id,
        userWhoWantUnsubscribe
      );
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;

      if (!uuid.validate(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const user = await fastify.db.users.findOne({ key: 'id', equals: id });

      if (user === null) {
        throw fastify.httpErrors.notFound();
      }

      return await fastify.db.users.change(id, request.body);
    }
  );
};

export default plugin;
