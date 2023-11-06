export default () => ({
  app: {
    name: process.env.APP_NAME || 'Etap Wallet Service API',
    env: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secretKey',
    expiresIn: process.env.JWT_EXPIRES_IN || '24hrs',
  },
  port: parseInt(process.env.PORT, 10) || 3030,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  },
  paystack: {
    base_url: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
    secret_key: process.env.PAYSTACK_SECRET_KEY,
  },
});
