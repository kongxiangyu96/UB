"""OSS helper for pdf-worker."""
import io
import oss2
from config import settings


def upload_bytes(data: bytes, object_key: str, content_type: str = "text/markdown") -> str:
    auth = oss2.Auth(settings.oss_access_key_id, settings.oss_access_key_secret)
    bucket = oss2.Bucket(auth, settings.oss_endpoint, settings.oss_bucket_name)
    bucket.put_object(object_key, io.BytesIO(data), headers={"Content-Type": content_type})
    return object_key
