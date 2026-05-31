from django.db import migrations, models


def seed_plafond(apps, schema_editor):
    Enseignant = apps.get_model('enseignants', 'Enseignant')
    ParametresPfe = apps.get_model('pfes', 'ParametresPfe')
    vals = []
    for e in Enseignant.objects.all():
        mg = getattr(e, 'maxGroupesPfe', None)
        if mg is not None:
            try:
                vals.append(int(mg))
            except (TypeError, ValueError):
                pass
    v = max(vals) if vals else 5
    v = max(1, min(99, v))
    ParametresPfe.objects.get_or_create(pk=1, defaults={'plafond_groupes': v})


class Migration(migrations.Migration):

    dependencies = [
        ('enseignants', '0003_enseignant_maxgroupespfe'),
        ('pfes', '0003_soutenance_rapporteur_enseignant'),
    ]

    operations = [
        migrations.CreateModel(
            name='ParametresPfe',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                (
                    'plafond_groupes',
                    models.PositiveSmallIntegerField(
                        default=5,
                        help_text='Nombre maximal de groupes PFE simultanés par encadrant (et même plafond pour rapporteur).',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Paramètres PFE',
                'verbose_name_plural': 'Paramètres PFE',
            },
        ),
        migrations.RunPython(seed_plafond, migrations.RunPython.noop),
    ]
