import pytest

# DEPRECATED: admin_auth module was removed in favor of Supabase JWT + profile.role
# These tests are kept for reference but are skipped as the module no longer exists

@pytest.mark.skip(reason="admin_auth module was replaced with Supabase JWT authentication")
def test_admin_auth_deprecated():
    pass
