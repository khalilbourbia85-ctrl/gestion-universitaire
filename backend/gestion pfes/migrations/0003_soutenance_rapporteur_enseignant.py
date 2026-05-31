import django.db.models.deletion
from django.db import migrations, models


def forwards_copy_rapporteur_to_enseignant(apps, schema_editor):
    Soutenance = apps.get_model('pfes', 'Soutenance')
    Enseignant = apps.get_model('enseignants', 'Enseignant')
    if not Soutenance.objects.exists():
        return
    fallback = Enseignant.objects.order_by('matricule').first()
    if fallback is None:
        raise RuntimeError(
            'Migration pfes 0003 : au moins un enseignant est requis pour convertir '
            'les rapporteurs des soutenances vers la table enseignants.'
        )
    for s in Soutenance.objects.all():
        old_matricule = getattr(s, 'rapporteur_id', None)
        ens = None
        if old_matricule:
            ens = Enseignant.objects.filter(pk=old_matricule).first()
        if ens is None:
            ens = fallback
        s.rapporteur_enseignant = ens
        s.save(update_fields=['rapporteur_enseignant'])


class Migration(migrations.Migration):

    dependencies = [
        ('enseignants', '0002_alter_diplome_specialite'),
        ('pfes', '0002_rapporteur_remove_pfe_jury_pfe_convention_file_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='soutenance',
            name='rapporteur_enseignant',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='soutenances_comme_rapporteur_tmp',
                to='enseignants.enseignant',
            ),
        ),
        migrations.RunPython(forwards_copy_rapporteur_to_enseignant, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='soutenance',
            name='rapporteur',
        ),
        migrations.RenameField(
            model_name='soutenance',
            old_name='rapporteur_enseignant',
            new_name='rapporteur',
        ),
        migrations.AlterField(
            model_name='soutenance',
            name='rapporteur',
            field=models.ForeignKey(
                help_text='Enseignant rapporteur (exclut le contrat « Contractuel » seul).',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='soutenances_comme_rapporteur',
                to='enseignants.enseignant',
            ),
        ),
    ]
