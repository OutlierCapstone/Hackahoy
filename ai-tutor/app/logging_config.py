# app/logging_config.py

import logging
import sys
from logging.handlers import RotatingFileHandler

# Set up logging
def setup_logging() -> logging.Logger:
    logger = logging.getLogger("ai_tutor")
    
    if logger.hasHandlers():
        return logger
    
    logger.setLevel(logging.DEBUG)
    
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    
    file_handler = RotatingFileHandler("app.log",
                                       maxBytes=5*1024*1024, # 5 MB
                                       backupCount=2
                                       )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    return logger
