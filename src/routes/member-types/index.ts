import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import { isValidPatchedData } from '../../utils/helpers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    return await fastify.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const { id } = request.params;

      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: id,
      });

      if (memberType === null) {
        throw fastify.httpErrors.notFound();
      }
      return memberType;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const { id } = request.params;
      const dataToUpdate = (request.body);

      if (!isValidPatchedData(dataToUpdate, ['discount', 'monthPostsLimit'])) {
        throw fastify.httpErrors.badRequest();
      }

      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: id,
      });

      if (memberType === null) {
        throw fastify.httpErrors.notFound();
      }

      return await fastify.db.memberTypes.change(id, dataToUpdate);
    }
  );
};

export default plugin;
