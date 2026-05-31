import datetime

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pfes', '0004_parametrespfe'),
    ]

    operations = [
        migrations.AddField(
            model_name='soutenance',
            name='heure_soutenance',
            field=models.TimeField(
                default=datetime.time(9, 0),
                help_text='Heure exacte de début de la soutenance.',
            ),
        ),
    ]
