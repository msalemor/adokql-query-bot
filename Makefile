default:
	@echo "Please use 'make <target>' to run a specific target."

build-ui:
	cd frontend && bun run build-prod
	rm -rf static
	mkdir static
	cp -r frontend/dist/* static/	

run: build-ui
	poetry run python -m src.adokqlbot.main

VERSION=0.0.1
TAG=am8850/adokqlbot:$(VERSION)
docker-build: build-ui
	docker build -t $(TAG) .