"""
Fare app configuration - business logic only, no models.
"""
from django.apps import AppConfig


class FareConfig(AppConfig):
    """Configuration for the Fare app."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'fare'
    verbose_name = 'Fare Management'