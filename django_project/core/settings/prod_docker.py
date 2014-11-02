from .prod import *  # noqa
import os
print os.environ

ALLOWED_HOSTS = ['*']

ADMINS = (('Tim Sutton', 'tim@kartoza.com'), )
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': os.environ['DATABASE_NAME'],
        'USER': os.environ['DATABASE_USERNAME'],
        'PASSWORD': os.environ['DATABASE_PASSWORD'],
        'HOST': os.environ['DATABASE_HOST'],
        'PORT': 5432,
        'TEST_NAME': 'unittests',
    }
}

EMAIL_HOST = 'healthsites-postfix'
EMAIL_HOST_USER = 'info'
EMAIL_HOST_PASSWORD = 'info'
EMAIL_PORT = 25
EMAIL_USE_TLS = False
