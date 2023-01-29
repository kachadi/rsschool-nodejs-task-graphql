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
          const updateSubscribedToUserIds = el.subscribedToUserIds.filter(
            (i) => i !== id
          );

          el.subscribedToUserIds = updateSubscribedToUserIds;

          await fastify.db.users.change(el.id, el);
        }
      });

      const deletedUserPosts = await fastify.db.posts.findMany({
        key: 'userId',
        equals: id,
      });

      deletedUserPosts.forEach(async (post) => {
        await fastify.db.posts.delete(post.id);
      });

      const deletedUserProfiles = await fastify.db.profiles.findMany({
        key: 'userId',
        equals: id,
      });

      deletedUserProfiles.forEach(async (profile) => {
        await fastify.db.profiles.delete(profile.id);
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

      const { userId: userIdWhoWantsSubscribe } = request.body;

      const user = await fastify.db.users.findOne({ key: 'id', equals: id });

      if (user === null) {
        throw fastify.httpErrors.notFound();
      }

      const userWhoWantsSubscribe = await fastify.db.users.findOne({
        key: 'id',
        equals: userIdWhoWantsSubscribe,
      });

      if (userWhoWantsSubscribe === null) {
        throw fastify.httpErrors.notFound();
      }

      if (userWhoWantsSubscribe.subscribedToUserIds.includes(id)) {
        throw fastify.httpErrors.badRequest();
      }

      userWhoWantsSubscribe.subscribedToUserIds.push(id);
      return await fastify.db.users.change(
        userWhoWantsSubscribe.id,
        userWhoWantsSubscribe
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

      const { userId: userIdWhoWantsUnsubscribe } = request.body;
      const user = await fastify.db.users.findOne({ key: 'id', equals: id });

      if (user === null) {
        throw fastify.httpErrors.notFound();
      }

      const userWhoWantsUnsubscribe = await fastify.db.users.findOne({
        key: 'id',
        equals: userIdWhoWantsUnsubscribe,
      });

      if (userWhoWantsUnsubscribe === null) {
        throw fastify.httpErrors.notFound();
      }

      if (!userWhoWantsUnsubscribe.subscribedToUserIds.includes(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const updateSubscribedToUserIds =
        userWhoWantsUnsubscribe.subscribedToUserIds.filter((el) => el !== id);

      userWhoWantsUnsubscribe.subscribedToUserIds = updateSubscribedToUserIds;

      return await fastify.db.users.change(
        userWhoWantsUnsubscribe.id,
        userWhoWantsUnsubscribe
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
