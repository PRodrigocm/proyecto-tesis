const { Client } = require('pg');

async function testDatabaseConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'admin',
    password: '1234567',
  });

  try {
    console.log('🔍 Intentando conectar a la base de datos...');
    await client.connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log('📊 Versión de PostgreSQL:', result.rows[0].version);
    
    // Check if schema exists
    const schemaResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'proyecto-1'
    `);
    
    if (schemaResult.rows.length > 0) {
      console.log('✅ Schema "proyecto-1" existe');
    } else {
      console.log('⚠️  Schema "proyecto-1" no existe, creándolo...');
      await client.query('CREATE SCHEMA IF NOT EXISTS "proyecto-1"');
      console.log('✅ Schema "proyecto-1" creado');
    }
    
    await client.end();
    console.log('🔌 Conexión cerrada correctamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 La conexión a la base de datos está funcionando correctamente');
      console.log('💡 Puedes proceder con las migraciones de Prisma');
    } else {
      console.log('\n❌ Hay problemas con la conexión a la base de datos');
      console.log('🔧 Verifica que PostgreSQL esté ejecutándose y las credenciales sean correctas');
    }
    process.exit(success ? 0 : 1);
  });
