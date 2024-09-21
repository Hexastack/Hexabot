COMPOSE_FILES := -f ./docker/docker-compose.yml

# Function to add service files
define add_service
  ifeq ($(PROD), true)
	COMPOSE_FILES += -f ./docker/docker-compose.$(1).yml
    ifneq ($(wildcard ./docker/docker-compose.$(1).prod.yml),)
      COMPOSE_FILES += -f ./docker/docker-compose.$(1).prod.yml
    endif
  else ifeq ($(DEV_MODE), true)
    COMPOSE_FILES += -f ./docker/docker-compose.$(1).yml
	ifneq ($(wildcard ./docker/docker-compose.$(1).dev.yml),)
      COMPOSE_FILES += -f ./docker/docker-compose.$(1).dev.yml
    endif
  endif
endef


# Function to set up COMPOSE_FILES
define compose_files
	ifeq ($(1), true)
		ifneq ($(wildcard ./docker/docker-compose.dev.yml),)
			COMPOSE_FILES += -f ./docker/docker-compose.dev.yml
		endif
	endif
	ifneq ($(NGINX),)
		$(eval $(call add_service,nginx))
	endif
	ifneq ($(NLU),)
		$(eval $(call add_service,nlu))
	endif
endef

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
	$(eval $(call compose_files,true))
	docker compose $(COMPOSE_FILES) up -d

start: check-env
	$(eval $(call compose_files,false))
	docker compose $(COMPOSE_FILES) up -d

stop: check-env
	$(eval $(call compose_files,true))
	docker compose $(COMPOSE_FILES) down

destroy: check-env
	$(eval $(call compose_files,true))
	docker compose $(COMPOSE_FILES) down -v

migrate-up:
	$(eval $(call compose_files,false))
	docker-compose $(COMPOSE_FILES) up --no-deps -d database-init
