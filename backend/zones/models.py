from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Zone(models.Model):
    """
    Model representing a metro zone in the PearlCard system.
    """
    
    zone_number = models.IntegerField(
        unique=True,
        validators=[MinValueValidator(1), MaxValueValidator(3)],
        help_text="Unique zone identifier (e.g., 1 for Zone 1)"
    )
    
    name = models.CharField(
        max_length=100,
        help_text="Human-readable zone name"
    )
    
    description = models.TextField(
        blank=True,
        default="",
        help_text="Additional information about the zone"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this zone is currently operational"
    )
    
        
    def __str__(self):
        return f"Zone {self.zone_number}: {self.name}"