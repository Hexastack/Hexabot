# Default path setup
COMPOSE_FILES := -f ./docker/docker-compose.yml -f ./docker/docker-compose.dev.yml

# Function to add service files
define add_service
  ifeq ($(PROD), true)
	COMPOSE_FILES += -f ./docker/docker-compose.$(1).yml
    ifneq ($(wildcard ./docker/docker-compose.$(1).prod.yml),)
      COMPOSE_FILES += -f ./docker/docker-compose.$(1).prod.yml
    endif
  else
    COMPOSE_FILES += -f ./docker/docker-compose.$(1).yml
	ifneq ($(wildcard ./docker/docker-compose.$(1).dev.yml),)
      COMPOSE_FILES += -f ./docker/docker-compose.$(1).dev.yml
    endif
  endif
endef


# Check if services are specified and add corresponding compose files
ifneq ($(NGINX),)
  $(eval $(call add_service,nginx))
endif

ifneq ($(NLU),)
  $(eval $(call add_service,nlu))
endif

ifneq ($(SMTP4DEV),)
  $(eval $(call add_service,smtp4dev))
endif

# Ensure .env file exists and matches .env.example
check-env:
	@if [ ! -f "./docker/.env" ]; then \
		echo "Error: .env file does not exist. Creating one now from .env.example ..."; \
		cp ./docker/.env.example ./docker/.env; \
	fi
	@echo "Checking .env file for missing variables..."
	@awk -F '=' 'NR==FNR {a[$$1]; next} !($$1 in a) {print "Missing env var: " $$1}' ./docker/.env ./docker/.env.example

init:
	cp ./docker/.env.example ./docker/.env

dev: check-env
	docker compose $(COMPOSE_FILES) up -d

start: check-env
	docker compose $(COMPOSE_FILES) up -d --build

stop: check-env
	docker compose $(COMPOSE_FILES) down

destroy: check-env
	docker compose $(COMPOSE_FILES) down -v

migrate-up:
	docker-compose $(COMPOSE_FILES) up --no-deps -d database-init
