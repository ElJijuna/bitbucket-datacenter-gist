.PHONY: help install dev start build docker-build docker-run clean test lint docker-up docker-down docker-logs

help:
	@echo "Bitbucket Gist Manager - Comandos disponibles:"
	@echo ""
	@echo "Desarrollo:"
	@echo "  make install      - Instalar dependencias"
	@echo "  make dev          - Ejecutar en modo desarrollo"
	@echo "  make start        - Ejecutar en producción"
	@echo "  make test         - Ejecutar tests"
	@echo "  make lint         - Ejecutar linter"
	@echo "  make lint-fix     - Corregir problemas de linting"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Construir imagen Docker"
	@echo "  make docker-run   - Ejecutar contenedor"
	@echo "  make docker-up    - Iniciar con docker-compose"
	@echo "  make docker-down  - Detener docker-compose"
	@echo ""
	@echo "Limpieza:"
	@echo "  make clean        - Limpiar archivos temporales"

install:
	bun install

dev:
	bun run dev

start:
	bun run start

test:
	bun test

lint:
	bun run lint

lint-fix:
	bun run lint:fix

docker-build:
	docker build -t bitbucket-gist:latest .

docker-run: docker-build
	docker run -p 3000:3000 \
		-e BITBUCKET_SERVER_HOST=$${BITBUCKET_SERVER_HOST} \
		-e BITBUCKET_API_HOST=$${BITBUCKET_API_HOST} \
		-e BITBUCKET_USER=$${BITBUCKET_USER} \
		-e BITBUCKET_TOKEN=$${BITBUCKET_TOKEN} \
		-e BITBUCKET_PROJECT=$${BITBUCKET_PROJECT} \
		-e BITBUCKET_REPOSITORY=$${BITBUCKET_REPOSITORY} \
		bitbucket-gist:latest

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f gist-api

clean:
	rm -rf node_modules dist build coverage .nyc_output
	find . -name "*.log" -delete

.DEFAULT_GOAL := help
