from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Journey(models.Model):
    """
    Model to store journey history and calculated fares.
    Each record represents a single fare calculation request.
    """
    
    # Using CharField for zones to match the requirement
    # Could also use IntegerField if you prefer
    user_id = models.CharField(
        max_length=10,
        help_text="user id"
    )
    from_zone = models.CharField(
        max_length=10,
        help_text="Starting zone number"
    )
    
    to_zone = models.CharField(
        max_length=10,
        help_text="Destination zone number"
    )
    
    fare = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="Calculated fare amount (stored as integer)"
    )
    
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="When the journey was calculated"
    )
    class Meta:
        ordering = ['-timestamp']  # Most recent first
        verbose_name = "Journey"
        verbose_name_plural = "Journeys"
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['from_zone', 'to_zone']),
        ]
    
    def __str__(self):
        return f"Journey {self.id}: Zone {self.from_zone} → Zone {self.to_zone} (£{self.fare/100:.2f}) at {self.timestamp}"
