.PHONY: install dev build preview test coverage lint typecheck validate-html audit check docker-build docker-up docker-down

install:
	npm ci

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

test:
	npm test

coverage:
	npm run test:coverage

lint:
	npm run lint

typecheck:
	npm run typecheck

validate-html:
	npm run validate:html

audit:
	npm audit --audit-level=high

check:
	npm run check && npm audit --audit-level=high

docker-build:
	docker build -t tecsafe-web:latest .

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down
