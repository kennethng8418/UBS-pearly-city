"""
Create initial zone data
"""
from django.core.management.base import BaseCommand
from apps.zones.models import Zone


class Command(BaseCommand):
    help = 'Initialize zones with default data'
    
    def handle(self, *args, **options):
        zones_data = [
            {'zone_number': "1", 'name': 'Central', 'description': 'City center zone'},
            {'zone_number': "2", 'name': 'Inner Ring', 'description': 'Inner suburban zone'},
            {'zone_number': "3", 'name': 'Outer Ring', 'description': 'Outer suburban zone'},
        ]
        
        for data in zones_data:
            zone, created = Zone.objects.get_or_create(
                zone_number=data['zone_number'],
                defaults=data
            )
            if created:
                self.stdout.write(f'Created zone: {zone}')
            else:
                self.stdout.write(f'Zone exists: {zone}')
        
        self.stdout.write(self.style.SUCCESS('✅ Zones initialized!'))