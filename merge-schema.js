const fs = require('fs');
const path = require('path');

const models = path.join(__dirname, 'prisma', 'models');
const schemaPrismaPath = path.join(__dirname, 'prisma', 'schema.prisma');

const header = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

`;

function mergeSchemaPrisma() {
  const modelFiles = fs.readdirSync(models);
  const modelsContent = modelFiles
    .map(file => fs.readFileSync(path.join(models, file), 'utf-8'))
    .join('\n');

  fs.writeFileSync(schemaPrismaPath, header + modelsContent);
  console.log('schema.prisma has been updated with all models');
}

mergeSchemaPrisma();
