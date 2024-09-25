# Makefile
FOLDER := ./docker

# The services that can be toggled
SERVICES := nginx nlu smtp4dev

# Function to dynamically add Docker Compose files based on enabled services
define compose_files
  $(foreach service,$(SERVICES),$(if $($(shell echo $(service) | tr a-z A-Z)), -f $(FOLDER)/docker-compose.$(service).yml))
endef

# Function to dynamically add Docker Compose dev files based on enabled services and file existence
define compose_dev_files
  $(foreach service,$(SERVICES), \
  $(if $($(shell echo $(service) | tr a-z A-Z)), \
    $(if $(shell [ -f $(FOLDER)/docker-compose.$(service).dev.yml ] && echo yes), -f $(FOLDER)/docker-compose.$(service).dev.yml)))
endef

# Function to dynamically add Docker Compose dev files based on enabled services and file existence
define compose_prod_files
  $(foreach service,$(SERVICES), \
  $(if $($(shell echo $(service) | tr a-z A-Z)), \
    $(if $(shell [ -f $(FOLDER)/docker-compose.$(service).prod.yml ] && echo yes), -f $(FOLDER)/docker-compose.$(service).dev.yml)))
endef

# Ensure .env file exists and matches .env.example
check-env:
	@if [ ! -f "$(FOLDER)/.env" ]; then \
		echo "Error: .env file does not exist. Creating one now from .env.example ..."; \
		cp $(FOLDER)/.env.example $(FOLDER)/.env; \
	fi
	@echo "Checking .env file for missing variables..."
	@awk -F '=' 'NR==FNR {a[$$1]; next} !($$1 in a) {print "Missing env var: " $$1}' $(FOLDER)/.env $(FOLDER)/.env.example

init:
	cp $(FOLDER)/.env.example $(FOLDER)/.env

# Start command: runs docker-compose with the main file and any additional service files
start: check-env
	@docker compose -f $(FOLDER)/docker-compose.yml $(call compose_files) up -d

# Dev command: runs docker-compose with the main file, dev file, and any additional service dev files (if they exist)
dev: check-env
	@docker compose -f $(FOLDER)/docker-compose.yml -f $(FOLDER)/docker-compose.dev.yml $(call compose_files) $(call compose_dev_files) up -d

# Start command: runs docker-compose with the main file and any additional service files
start-prod: check-env
	@docker compose -f $(FOLDER)/docker-compose.yml -f $(FOLDER)/docker-compose.prod.yml $(call compose_files) $(call compose_prod_files) up -d

# Stop command: stops the running containers
stop:
	@docker compose -f $(FOLDER)/docker-compose.yml -f $(FOLDER)/docker-compose.dev.yml $(call compose_files) $(call compose_dev_files) $(call compose_prod_files) down

# Destroy command: stops the running containers and removes the volumes
destroy:
	@docker compose -f $(FOLDER)/docker-compose.yml -f $(FOLDER)/docker-compose.dev.yml $(call compose_files) $(call compose_dev_files) $(call compose_prod_files) down -v

# Migrate command:
migrate-up:
	@docker compose -f $(FOLDER)/docker-compose.yml -f $(FOLDER)/docker-compose.dev.yml $(call compose_files) $(call compose_dev_files) up --no-deps -d database-init
