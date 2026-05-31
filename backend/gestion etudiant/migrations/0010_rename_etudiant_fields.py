# Generated migration to rename nom and prenom to nom_fr and prenom_fr

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('etudiants', '0009_etudiant_genre'),
    ]

    operations = [
        migrations.RenameField(
            model_name='etudiant',
            old_name='nom',
            new_name='nom_fr',
        ),
        migrations.RenameField(
            model_name='etudiant',
            old_name='prenom',
            new_name='prenom_fr',
        ),
    ]
