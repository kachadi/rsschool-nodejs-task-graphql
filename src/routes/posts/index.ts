import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import * as uuid from 'uuid';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';
import { isValidPatchedData } from '../../utils/helpers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return await fastify.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params;

      const post = await fastify.db.posts.findOne({ key: 'id', equals: id });

      if (post === null) {
        throw fastify.httpErrors.notFound();
      }

      return post;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const newPost = await fastify.db.posts.create(request.body);
      return newPost;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params;

      if (!uuid.validate(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const post = await fastify.db.posts.findOne({ key: 'id', equals: id });

      if (post === null) {
        throw fastify.httpErrors.notFound();
      }

      await fastify.db.posts.delete(id);
      return post;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params;
      const dataToUpdate = request.body;

      if (!isValidPatchedData(dataToUpdate, ['title', 'content', 'userId'])) {
        throw fastify.httpErrors.badRequest();
      }

      const post = await fastify.db.posts.findOne({ key: 'id', equals: id });

      if (post === null) {
        throw fastify.httpErrors.notFound();
      }

      return await fastify.db.posts.change(id, dataToUpdate);
    }
  );
};

export default plugin;
