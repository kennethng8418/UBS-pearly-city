from django.contrib import admin
from .models import Zone

# Method 1: Simple Registration
# This gives you a basic admin interface with default settings
# admin.site.register(Zone)


# Method 2: Customized Registration with ModelAdmin
@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    """
    Customizes how the Zone model appears in Django admin.
    """
    
    # 1. LIST VIEW CUSTOMIZATION
    # Fields to display in the table view
    list_display = ['zone_number', 'name', 'is_active']
    
    # Fields that can be used to filter records
    list_filter = ['is_active']
    
    # Fields that can be searched
    search_fields = ['name', 'description']
    
    # Default ordering in the list view
    ordering = ['zone_number']
    
    # 2. DETAIL/EDIT VIEW CUSTOMIZATION
    # Group fields into sections
    fieldsets = (
        ('Basic Information', {
            'fields': ('zone_number', 'name')
        }),
        ('Details', {
            'fields': ('description', 'is_active'),
            'classes': ('collapse')  # Makes this section collapsible
        }),
    )
    
    # 3. ADDING CUSTOM ACTIONS
    actions = ['activate_zones', 'deactivate_zones']
    
    def activate_zones(self, request, queryset):
        """Custom action to activate multiple zones at once."""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} zones were activated.')
    activate_zones.short_description = 'Activate selected zones'
    
    def deactivate_zones(self, request, queryset):
        """Custom action to deactivate multiple zones at once."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} zones were deactivated.')
    deactivate_zones.short_description = 'Deactivate selected zones'