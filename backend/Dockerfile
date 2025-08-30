# Use official Python image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

#Install system dependencies required for psycopg2
RUN apt-get update \
    && apt-get -y install libpq-dev gcc \
    && pip install psycopg2

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy Django project
COPY backend/ .

# Expose Django port
EXPOSE 8000


# Run Django development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]