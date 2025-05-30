from django.db import models
from django.utils.translation import gettext_lazy as _
from mptt.models import MPTTModel, TreeForeignKey
from django.utils import timezone


class UserGroup(MPTTModel):
    """
    Model representing a group of users with tree structure.
    """
    name = models.CharField(_("Group Name"), max_length=255)
    description = models.TextField(_("Description"), blank=True)
    parent = TreeForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, 
                           related_name='children', verbose_name=_("Parent Group"))
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)

    class MPTTMeta:
        order_insertion_by = ['name']

    class Meta:
        verbose_name = _("User Group")
        verbose_name_plural = _("User Groups")
        db_table = 'user_groups'

    def __str__(self):
        return self.name


class User(models.Model):
    """
    Model representing a regular user in the system.
    """
    email = models.EmailField(_("Email"), unique=True)
    first_name = models.CharField(_("First Name"), max_length=150, blank=True)
    last_name = models.CharField(_("Last Name"), max_length=150, blank=True)
    phone_number = models.CharField(_("Phone Number"), max_length=20, blank=True)
    is_active = models.BooleanField(_("Is Active"), default=True)
    groups = models.ManyToManyField(UserGroup, related_name="users", blank=True, 
                                   verbose_name=_("User Groups"))
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    last_login = models.DateTimeField(_("Last Login"), null=True, blank=True)

    external_id = models.CharField(_("External ID"), max_length=50, blank=True, unique=True)

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email'], name='user_email_idx'),
            models.Index(fields=['external_id']),
        ]
        db_table = 'users'

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        """
        Return the full name of the user.
        """
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email


class UserIdentifierType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('User Identifier Type')
        verbose_name_plural = _('User Identifier Types')
        ordering = ['name']
        db_table = 'user_identifier_types'


    def __str__(self):
        return self.name


class UserIdentifier(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='identifiers')
    identifier_type = models.ForeignKey(UserIdentifierType, on_delete=models.PROTECT)
    value = models.CharField(max_length=255)
    is_enabled = models.BooleanField(default=True)
    comment = models.TextField(blank=True)
    auth_attribute_group = models.ForeignKey(
        'radius.AuthAttributeGroup',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    expiration_date = models.DateTimeField(null=True, blank=True)
    reject_expired = models.BooleanField(default=False)
    expired_auth_attribute_group = models.ForeignKey(
        'radius.AuthAttributeGroup',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expired_identifiers'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('User Identifier')
        verbose_name_plural = _('User Identifiers')
        ordering = ['-created_at']
        unique_together = ['user', 'identifier_type', 'value']
        db_table = 'user_identifiers'

    def __str__(self):
        return f"{self.user.id} - {self.identifier_type.name}: {self.value}"

    def is_expired(self):
        if not self.expiration_date:
            return False
        return self.expiration_date < timezone.now()

    def get_attribute_group(self):
        if self.is_expired() and not self.reject_expired and self.expired_auth_attribute_group:
            return self.expired_auth_attribute_group
        return self.auth_attribute_group

