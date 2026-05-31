from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('enseignants', '0003_enseignant_maxgroupespfe'),
        ('pfes', '0004_parametrespfe'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='enseignant',
            name='maxGroupesPfe',
        ),
    ]
