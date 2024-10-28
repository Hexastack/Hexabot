FROM python:3.11.4

# 
WORKDIR /app

# 
COPY ./requirements.txt ./requirements.txt

# Update pip
RUN pip3 install --upgrade pip

# Install deps
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Copy source code
COPY . .

EXPOSE 5000

# Entrypoint
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
