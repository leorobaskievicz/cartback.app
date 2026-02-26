const mysql = require('mysql2/promise');

async function query() {
  try {
    const connection = await mysql.createConnection({
      host: 'mainline.proxy.rlwy.net',
      port: 31155,
      user: 'root',
      password: 'DuaMooXLJvVJasIRDdtdtMCJtztKJgSs',
      database: 'railway'
    });

    console.log('\n✅ Conectado!\n');
    
    console.log('=== TODOS OS TELEFONES NO SISTEMA ===\n');
    const [all] = await connection.execute(`
      SELECT DISTINCT customer_phone, COUNT(*) as carrinhos
      FROM abandoned_carts 
      GROUP BY customer_phone
      ORDER BY carrinhos DESC
      LIMIT 20
    `);
    console.table(all);

    console.log('\n=== TODOS OS TELEFONES NOS LOGS ===\n');
    const [logs] = await connection.execute(`
      SELECT DISTINCT phone_number, status, COUNT(*) as total
      FROM message_logs
      GROUP BY phone_number, status
      ORDER BY total DESC
      LIMIT 20
    `);
    console.table(logs);

    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

query();
