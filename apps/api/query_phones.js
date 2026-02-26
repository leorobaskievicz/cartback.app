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

    console.log('\n✅ Conectado ao banco Railway!\n');
    
    console.log('=== CARRINHOS DOS NÚMEROS PROBLEMÁTICOS ===\n');
    const [carts] = await connection.execute(`
      SELECT customer_phone, status, COUNT(*) as total, MAX(created_at) as ultimo
      FROM abandoned_carts 
      WHERE customer_phone LIKE '%98027292%' OR customer_phone LIKE '%92489909%'
      GROUP BY customer_phone, status
    `);
    console.table(carts);

    console.log('\n=== LOGS DE MENSAGENS DESSES NÚMEROS ===\n');
    const [logs] = await connection.execute(`
      SELECT phone_number, status, error_message, created_at
      FROM message_logs
      WHERE phone_number LIKE '%98027292%' OR phone_number LIKE '%92489909%'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.table(logs);
    
    console.log('\n=== COMPARAÇÃO: NÚMEROS QUE FUNCIONAM ===\n');
    const [working] = await connection.execute(`
      SELECT phone_number, status, COUNT(*) as total
      FROM message_logs
      WHERE phone_number LIKE '%99261087%' OR phone_number LIKE '%95195024%' OR phone_number LIKE '%91850999%'
      GROUP BY phone_number, status
      ORDER BY phone_number, status
    `);
    console.table(working);

    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

query();
