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
TAG=am8850/adokqlbot
docker-build: build-ui
	docker build -t $(TAG):$(VERSION) .

docker-run: docker-build
	docker run --rm -p 8000:8000 --env-file=.env $(TAG):$(VERSION)
		