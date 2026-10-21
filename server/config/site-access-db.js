import mysql from 'mysql2/promise';

const connectionOptions = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.SITE_ACCESS_DB_USER || '__site_access_unconfigured__',
  password: process.env.SITE_ACCESS_DB_PASSWORD || '',
  database: 'parque100_acceso',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
};

const siteAccessPool = mysql.createPool(connectionOptions);

export function assertSiteAccessDbConfig() {
  if (!process.env.SITE_ACCESS_DB_USER || !process.env.SITE_ACCESS_DB_PASSWORD) {
    throw new Error('Ejecuta `npm run access:provision` para configurar la base privada de acceso.');
  }
}

export default siteAccessPool;
