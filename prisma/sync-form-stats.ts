import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncFormStats() {
  console.log('🔄 Iniciando sincronização de estatísticas dos formulários...\n');

  try {
    // Buscar todos os formulários
    const forms = await prisma.form.findMany({
      select: {
        id: true,
        name: true,
        totalViews: true,
        totalResponses: true,
      },
    });

    console.log(`📊 Encontrados ${forms.length} formulários para sincronizar\n`);

    let updated = 0;
    let unchanged = 0;

    for (const form of forms) {
      // Contar views reais (unique por fingerprint)
      const realViews = await prisma.formView.count({
        where: { formId: form.id },
      });

      // Contar respostas reais
      const realResponses = await prisma.formSubmission.count({
        where: { formId: form.id },
      });

      // Verificar se precisa atualizar
      if (
        form.totalViews !== realViews ||
        form.totalResponses !== realResponses
      ) {
        await prisma.form.update({
          where: { id: form.id },
          data: {
            totalViews: realViews,
            totalResponses: realResponses,
          },
        });

        console.log(`✅ ${form.name}`);
        console.log(
          `   Views: ${form.totalViews} → ${realViews} (${realViews - form.totalViews >= 0 ? '+' : ''}${realViews - form.totalViews})`,
        );
        console.log(
          `   Respostas: ${form.totalResponses} → ${realResponses} (${realResponses - form.totalResponses >= 0 ? '+' : ''}${realResponses - form.totalResponses})`,
        );

        // Calcular conversão
        const oldConversion =
          form.totalViews > 0
            ? ((form.totalResponses / form.totalViews) * 100).toFixed(2)
            : '0.00';
        const newConversion =
          realViews > 0
            ? ((realResponses / realViews) * 100).toFixed(2)
            : '0.00';
        console.log(
          `   Conversão: ${oldConversion}% → ${newConversion}%\n`,
        );

        updated++;
      } else {
        unchanged++;
      }
    }

    console.log('\n📈 Resumo:');
    console.log(`   ✅ Atualizados: ${updated}`);
    console.log(`   ⏭️  Sem mudanças: ${unchanged}`);
    console.log(`   📊 Total: ${forms.length}\n`);

    console.log('✨ Sincronização concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante sincronização:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncFormStats();
