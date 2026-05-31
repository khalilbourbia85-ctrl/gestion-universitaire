# Generated migration to rename 'parcours' field to 'specialite'

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion academique', '0013_alter_affectationdetail_options_alter_module_options_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='licence',
            old_name='parcours',
            new_name='specialite',
        ),
    ]
