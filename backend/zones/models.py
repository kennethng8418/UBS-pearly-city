from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Zone(models.Model):
    """
    Model representing a metro zone in the PearlCard system.
    """
    
    ZONE_CHOICES = [
        ("1", "1"),
        ("2", "2"),
        ("3", "3"),
    ]

    zone_number = models.CharField(max_length=20, choices=ZONE_CHOICES, unique=True)

    
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