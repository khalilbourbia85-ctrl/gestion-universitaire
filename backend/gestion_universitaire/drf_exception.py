"""Gestionnaire d'exceptions DRF."""

import traceback
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def drf_db_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        return response
    
    # Log the exception details
    logger.error(f"Unhandled exception in {context.get('view')}: {str(exc)}", exc_info=True)
    
    # Return a proper error response instead of None
    return Response(
        {
            'error': 'Une erreur interne s\'est produite',
            'detail': str(exc) if hasattr(exc, '__str__') else 'Erreur inconnue'
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
