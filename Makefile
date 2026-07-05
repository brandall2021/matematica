.PHONY: build up down logs clean restart psql

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

restart:
	docker compose restart

psql:
	docker compose exec postgres psql -U matematica -d matematica

clean:
	docker compose down -v --rmi local

ollama-up:
	docker compose --profile ollama up -d

ollama-pull:
	docker compose --profile ollama exec ollama ollama pull llama3.1
	docker compose --profile ollama exec ollama ollama pull nomic-embed-text

status:
	docker compose ps

backend-logs:
	docker compose logs -f backend

frontend-logs:
	docker compose logs -f frontend
