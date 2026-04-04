import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
};

export const env = {
  port:               parseInt(process.env.PORT ?? '5000'),
  nodeEnv:            process.env.NODE_ENV ?? 'development',
  clientUrl:          process.env.CLIENT_URL ?? 'http://localhost:5173',

  databaseUrl:        required('DATABASE_URL'),

  jwtSecret:          required('JWT_SECRET'),
  jwtRefreshSecret:   required('JWT_REFRESH_SECRET'),
  jwtExpiresIn:       process.env.JWT_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn:process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',

  anthropicApiKey:    required('ANTHROPIC_API_KEY'),

  stripeSecretKey:    process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret:process.env.STRIPE_WEBHOOK_SECRET ?? '',
  stripePriceIdPro:   process.env.STRIPE_PRICE_ID_PRO ?? '',

  sendgridApiKey:     process.env.SENDGRID_API_KEY ?? '',
  emailFrom:          process.env.EMAIL_FROM ?? 'noreply@focusflow.app',

  cloudinaryCloudName:process.env.CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryApiKey:   process.env.CLOUDINARY_API_KEY ?? '',
  cloudinaryApiSecret:process.env.CLOUDINARY_API_SECRET ?? '',

  isDev:  () => process.env.NODE_ENV === 'development',
  isProd: () => process.env.NODE_ENV === 'production',
};
