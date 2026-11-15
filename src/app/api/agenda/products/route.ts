import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAgendaTables } from '@/lib/agenda-db';

export async function POST(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const body = await req.json();
    const { action = 'save_product' } = body;

    let orgId = body.organizationId;
    if (!orgId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId)) {
      const orgRes = await query('SELECT id FROM organizations LIMIT 1;');
      orgId = orgRes.rows[0]?.id;
    }

    if (action === 'record_sale') {
      // Registrar Venda de Balcão
      const {
        clientName,
        productId,
        productName,
        quantity = 1,
        unitPrice,
        professionalId,
        paymentMethod = 'pix',
        notes = '',
      } = body;

      const qty = parseInt(String(quantity), 10) || 1;
      const price = parseFloat(String(unitPrice)) || 0;
      const total = qty * price;

      // Calcular comissão do profissional se houver profissional vinculado
      let commissionAmount = 0;
      if (professionalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(professionalId)) {
        const profRes = await query(
          'SELECT product_commission_pct FROM professionals WHERE id = $1 LIMIT 1;',
          [professionalId]
        );
        const pct = parseFloat(profRes.rows[0]?.product_commission_pct) || 0;
        commissionAmount = (total * pct) / 100;

        if (commissionAmount > 0) {
          await query(
            `INSERT INTO commissions (
               organization_id, professional_id, type, description,
               base_amount, commission_pct, commission_amount, status
             ) VALUES ($1, $2, 'produto', $3, $4, $5, $6, 'pendente');`,
            [
              orgId,
              professionalId,
              `Venda: ${productName || 'Produto'} (${qty} un)`,
              total,
              pct,
              commissionAmount,
            ]
          );
        }
      }

      // Registrar venda
      const saleRes = await query(
        `INSERT INTO product_sales (
           organization_id, client_name, professional_id, product_id,
           product_name, quantity, unit_price, total_amount, commission_amount,
           payment_method, notes
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id;`,
        [
          orgId,
          clientName?.trim() || 'Cliente Balcão',
          professionalId && professionalId.length === 36 ? professionalId : null,
          productId && productId.length === 36 ? productId : null,
          productName?.trim() || 'Produto Diverso',
          qty,
          price,
          total,
          commissionAmount,
          paymentMethod,
          notes?.trim() || '',
        ]
      );

      // Baixa no estoque se tiver produto cadastrado
      if (productId && productId.length === 36) {
        await query(
          'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2;',
          [qty, productId]
        );
      }

      return NextResponse.json({ success: true, saleId: saleRes.rows[0]?.id });
    }

    // Salvar Produto (Criar / Editar)
    const {
      id,
      name,
      category = 'Geral',
      price,
      costPrice = 0,
      stockQuantity = 0,
      minStockAlert = 5,
      commissionPct = 0,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'O nome do produto é obrigatório' }, { status: 400 });
    }

    const numPrice = parseFloat(String(price)) || 0;
    const numCost = parseFloat(String(costPrice)) || 0;
    const numStock = parseInt(String(stockQuantity), 10) || 0;
    const numAlert = parseInt(String(minStockAlert), 10) || 5;
    const numComm = parseFloat(String(commissionPct)) || 0;

    let prodId = id;
    if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      await query(
        `UPDATE products
         SET name = $1, category = $2, price = $3, cost_price = $4,
             stock_quantity = $5, min_stock_alert = $6, commission_pct = $7
         WHERE id = $8 AND organization_id = $9;`,
        [name.trim(), category.trim(), numPrice, numCost, numStock, numAlert, numComm, id, orgId]
      );
    } else {
      const insRes = await query(
        `INSERT INTO products (
           organization_id, name, category, price, cost_price,
           stock_quantity, min_stock_alert, commission_pct, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING id;`,
        [orgId, name.trim(), category.trim(), numPrice, numCost, numStock, numAlert, numComm]
      );
      prodId = insRes.rows[0]?.id;
    }

    return NextResponse.json({ success: true, productId: prodId });
  } catch (error: any) {
    console.error('[Agenda Products API] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID do produto obrigatório' }, { status: 400 });
    }

    await query('UPDATE products SET is_active = false WHERE id = $1::uuid;', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Agenda Products DELETE] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
