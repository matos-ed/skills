// Seeds the same synthetic cities in both databases. Usage (from the repo): node <this file> <db> [<db>...]
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { MongoClient, ObjectId } = require('mongodb');

const city = (id, nome, isDeliveryAtivo) => ({
  _id: new ObjectId(id), nome, uf: 'SP', isServicoDisponivel: true, isDeliveryAtivo,
  ceps: ['01000-000'], bairros: ['Centro'],
  imagemBackground: { src: 'https://example.com/bg.jpg', publicId: 'bg', version: 'v1' },
  trelloBoardId: 'trello', formLabel: 'form', faixasCep: [{ inicio: 1000000, fim: 1999999 }],
  updatedAt: new Date('2026-01-01T00:00:00Z'), afiliadoAtivo: true, afiliadoDiaLimitePagamento: 10,
  afiliadoDiaRepasse: 15, afiliadoId: new ObjectId('6af7c0000000000000000099'), afiliadoPercentual: 5,
  codigoIbge: `35${id.slice(-5)}`, latitude: '-23.55', longitude: '-46.63',
  geoLocalizacaoBairros: [{ bairro: 'Centro', latitude: -23.55, longitude: -46.63 }],
  taxasPadroes: [{ categoria: 'PADRAO', taxaFixa: 5, taxaVariavel: 10, taxaOnline: 3 }],
  isCouponActive: true, queroLogCityId: new ObjectId('6af7c0000000000000000098'),
  isBillingNeighborhood: false, isQueroLog: false, hasCloudOperationOnCity: false,
  configTaxService: { type: 'FIXED', value: 1, isMinimumOrder: false }, isTaxService: false,
});

const client = await MongoClient.connect('mongodb://localhost:27027/?directConnection=true');
for (const db of process.argv.slice(2)) {
  const municipio = client.db(db).collection('municipio');
  await municipio.deleteMany({});
  await municipio.insertMany([
    city('6af7c0000000000000000001', 'Cidade Com Delivery', true),
    city('6af7c0000000000000000002', 'Cidade Sem Delivery', false),
  ]);
  console.log(`${db}: 2 cities`);
}
await client.close();
