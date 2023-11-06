import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

let PORT: number;
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log'],
  });

  const configService = app.get<ConfigService>(ConfigService);
  app.enableCors({
    origin: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: 'GET,HEAD,PUT,PATCH,POST,OPTIONS',
    credentials: true,
    exposedHeaders: ['Access-Control-Allow-Origin'],
  });
  PORT = configService.get<number>('port');
  const APP_NAME = configService.get<string>('app.name', 'APP');
  const NODE_ENV = configService.get<string>('app.env', 'test');

  app.setGlobalPrefix('v1', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  // swagger documentation
  const options = new DocumentBuilder()
    .setTitle(APP_NAME.toUpperCase())
    .setDescription('Api Documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  //Class Validator
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(PORT, () =>
    console.log(`${APP_NAME} started on port ${PORT} ENV: ${NODE_ENV}`),
  );
}

bootstrap().then(() => {
  console.info(`
      ------------
      Internal Application Started!
      API: http://localhost:${PORT}/v1
      API Docs: http://localhost:${PORT}/docs
      ------------
`);
});
