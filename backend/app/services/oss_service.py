import io
import oss2
from app.core.config import settings


def _get_bucket() -> oss2.Bucket:
    auth = oss2.Auth(settings.oss_access_key_id, settings.oss_access_key_secret)
    return oss2.Bucket(auth, settings.oss_endpoint, settings.oss_bucket_name)


def upload_bytes(data: bytes, object_key: str, content_type: str = "application/octet-stream") -> str:
    """Upload bytes to OSS. Returns the object key."""
    bucket = _get_bucket()
    bucket.put_object(object_key, io.BytesIO(data), headers={"Content-Type": content_type})
    return object_key


def get_url(object_key: str, expires: int = 3600) -> str:
    """Generate a pre-signed URL for the object."""
    bucket = _get_bucket()
    return bucket.sign_url("GET", object_key, expires)


def delete_object(object_key: str) -> None:
    bucket = _get_bucket()
    bucket.delete_object(object_key)
