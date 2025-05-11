default:
	@echo "Please use 'make <target>' to run a specific target."

build-ui:
	cd frontend && bun run build
	rm -rf static
	mkdir static
	cp -r frontend/dist/* static/	