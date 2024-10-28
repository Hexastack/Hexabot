# FROM python:3.11.4
#
# #
# WORKDIR /app
#
# #
# COPY ./requirements.txt ./requirements.txt
#
# # Update pip
# RUN pip3 install --upgrade pip
#
# # Install deps
# RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt
#
# # Copy source code
# COPY . .
#
# # Entrypoint
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]

FROM python:3-slim

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

CMD mlflow server \
  --backend-store-uri ${BACKEND_URI} \
  --default-artifact-root ${ARTIFACT_ROOT} \
  --host 0.0.0.0