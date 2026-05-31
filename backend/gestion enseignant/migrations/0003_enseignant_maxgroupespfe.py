from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('enseignants', '0002_alter_diplome_specialite'),
    ]

    operations = [
        migrations.AddField(
            model_name='enseignant',
            name='maxGroupesPfe',
            field=models.PositiveSmallIntegerField(
                default=5,
                help_text='Nombre maximal de groupes PFE que cet encadrant peut encadrer simultanément.',
            ),
        ),
    ]
