.PHONY: setup start stop

setup:
	@if [ "$(OS)" = "Windows_NT" ]; then \
		powershell -ExecutionPolicy Bypass -File setup.ps1; \
	else \
		chmod +x setup.sh && ./setup.sh; \
	fi

start:
	@if [ "$(OS)" = "Windows_NT" ]; then \
		powershell -ExecutionPolicy Bypass -File start.ps1; \
	else \
		./start.sh; \
	fi

stop:
	@if [ "$(OS)" = "Windows_NT" ]; then \
		powershell -ExecutionPolicy Bypass -File stop.ps1; \
	else \
		./stop.sh; \
	fi
