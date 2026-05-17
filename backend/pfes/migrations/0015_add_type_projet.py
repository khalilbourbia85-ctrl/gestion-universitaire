from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pfes', '0014_soutenance_depot_electronique_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='pfe',
            name='type_projet',
            field=models.CharField(
                max_length=100,
                null=True,
                blank=True,
                help_text='Type de projet pour le PFE',
            ),
        ),
    ]
