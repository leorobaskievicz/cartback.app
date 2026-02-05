#!/bin/bash

echo "🧹 Limpando todas as instâncias do WhatsApp..."
echo ""

# Listar instâncias
echo "📋 Instâncias atuais na Evolution API:"
curl -s -X GET 'http://localhost:8080/instance/fetchInstances' \
  -H 'apikey: cartback_dev_key_123' | python3 -m json.tool | grep '"name"'

echo ""
echo "🗑️  Deletando todas as instâncias da Evolution API..."

# Deletar todas as instâncias
curl -s -X GET 'http://localhost:8080/instance/fetchInstances' \
  -H 'apikey: cartback_dev_key_123' | \
  python3 -c "
import sys, json
instances = json.load(sys.stdin)
for instance in instances:
    print(instance['name'])
" | while read name; do
  curl -s -X DELETE "http://localhost:8080/instance/delete/$name" \
    -H 'apikey: cartback_dev_key_123' > /dev/null
  echo "  ✓ Deleted: $name"
done

echo ""
echo "🗑️  Limpando banco de dados..."
docker exec cartback-mysql mysql -uroot -proot cartback -e \
  "DELETE FROM whatsapp_instances; SELECT COUNT(*) as remaining FROM whatsapp_instances;" 2>/dev/null | tail -n 1

echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "Agora você pode conectar um novo WhatsApp através da interface web."
