// Synthetic registers, identical in both local databases.
// Run from the repo: NODE_PATH=$PWD/node_modules npx ts-node --transpile-only -P tsconfig.json <this file>
import path from 'node:path';
import { MongoClient, ObjectId } from 'mongodb';

const REPO = process.cwd();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { generateMockRegisterEntity } = require(path.join(REPO, 'src/__tests__/mock/register.mock'));

export const BUSINESS_REGISTER = '6af700000000000000000001';
export const DOCUMENT_REGISTER = '6af700000000000000000002';

async function main() {
  const client = await MongoClient.connect('mongodb://localhost:27027/?directConnection=true');

  for (const dbName of ['autoreg_branch', 'autoreg_base']) {
    const registers = client.db(dbName).collection('register');
    await registers.deleteMany({});

    // Ready for the business, catalog and address steps of the v2 self-registration.
    const business = generateMockRegisterEntity({
      _id: BUSINESS_REGISTER,
      placeName: 'Lanche Bão Local',
      status: 'INCOMPLETO',
      step: 'DADOS_PINO_LOCALIZACAO',
    });

    // CPF rejected by name mismatch: the partner must send the identity document.
    const document = generateMockRegisterEntity({
      _id: DOCUMENT_REGISTER,
      placeName: 'Lanche Bão Documento',
      partnerCpfValidation: { isValid: false, statusCode: 200, message: 'Divergência de nome' },
    });

    for (const register of [business, document]) {
      await registers.insertOne({
        ...JSON.parse(JSON.stringify(register)),
        _id: new ObjectId(String(register._id)),
        createdAt: new Date(),
        updatedAt: new Date(),
        stepSince: new Date(),
      });
    }
    console.log(dbName, await registers.countDocuments());
  }

  await client.close();
}

main();
