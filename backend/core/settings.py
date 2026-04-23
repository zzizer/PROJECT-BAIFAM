from pathlib import Path
import os
from dotenv import load_dotenv
from pathlib import Path
import dj_database_url
from corsheaders.defaults import default_headers
from datetime import timedelta

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY is missing in the .env file")


DEBUG = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "daphne",
    "channels",
    "jazzmin",
    "corsheaders",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "django_celery_beat",
    "django_celery_results",
    "users",
    "device",
    "system",
    "staff",
    "fingerprints",
    "api_mgt",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "api_mgt.middleware.APIKeyRequestLogMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

ASGI_APPLICATION = "core.asgi.application"

DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL", "sqlite:///db.sqlite3")
    )
}


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


LANGUAGE_CODE = "en-us"

TIME_ZONE = "Africa/Nairobi"

USE_I18N = True

USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "users.CustomUser"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "api_mgt.authentication.APIKeyAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
        "api_mgt.permissions.HasRequiredScopes",
    ),
    "DEFAULT_PAGINATION_CLASS": "utils.pagination.CustomPageNumberPagination",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_HEADERS = list(default_headers) + [
    "X-API-KEY",
]

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}


AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.environ.get("EMAIL_HOST")
EMAIL_HOST_USER = os.environ.get("RESPONSE_EMAIL", None)
EMAIL_HOST_PASSWORD = os.environ.get("RESPONSE_EMAIL_PASSWORD", None)
EMAIL_PORT = 587
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = os.environ.get("RESPONSE_EMAIL", None)


CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.environ.get("REDIS_URL", "redis://localhost:6379/10")],
        },
    },
}

CELERY_BROKER_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/10")
CELERY_RESULT_BACKEND = os.environ.get("REDIS_URL", "redis://localhost:6379/10")
CELERY_TASK_DEFAULT_QUEUE = "supraledger_queue"

CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"

CELERY_TIMEZONE = TIME_ZONE

CELERY_TASK_TRACK_STARTED = True  # Marks task as "STARTED" when picked up
CELERY_TASK_TIME_LIMIT = 30 * 60  # Hard limit — task killed after 30 mins
CELERY_ACKS_LATE = True  # Don't acknowledge until the task is done
CELERY_WORKER_PREFETCH_MULTIPLIER = 1  # Ensures fair task distribution between workers

CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"


DEVICE_SERIAL_NUMBER = os.getenv("DEVICE_SERIAL_NUMBER")
DEVICE_MODEL = os.getenv("DEVICE_MODEL")
HARDWARE_VERSION = os.getenv("HARDWARE_VERSION")
FIRMWARE_VERSION = os.getenv("FIRMWARE_VERSION")
FINGERPRINT_TEMPLATE_SIZE = os.getenv("FINGERPRINT_TEMPLATE_SIZE")

if not DEVICE_SERIAL_NUMBER:
    raise ValueError("DEVICE_SERIAL_NUMBER is missing in the .env file")

if not DEVICE_MODEL:
    raise ValueError("DEVICE_MODEL is missing in the .env file")

if not HARDWARE_VERSION:
    raise ValueError("HARDWARE_VERSION is missing in the .env file")

if not FIRMWARE_VERSION:
    raise ValueError("FIRMWARE_VERSION is missing in the .env file")

if not FINGERPRINT_TEMPLATE_SIZE:
    raise ValueError("FINGERPRINT_TEMPLATE_SIZE is missing in the .env file")
