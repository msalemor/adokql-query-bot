default:
	@echo "Please use 'make <target>' to run a specific target."

build-ui:
	cd frontend && bun run build-prod
	rm -rf static
	mkdir static
	cp -r frontend/dist/* static/	

run: build-ui
	poetry run python -m src.adokqlbot.main

docker-build: build-ui
	docker build -t am8850/adokqlbot:0.01 .