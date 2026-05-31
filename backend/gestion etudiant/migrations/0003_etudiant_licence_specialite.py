import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academique', '0002_specialite_alter_module_unique_together_and_more'),
        ('etudiants', '0002_remove_etudiant_dateinscription_etudiant_nationalite_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='etudiant',
            name='licence',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='etudiants',
                to='academique.licence',
            ),
        ),
        migrations.AddField(
            model_name='etudiant',
            name='specialite',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='etudiants',
                to='academique.specialite',
            ),
        ),
    ]
